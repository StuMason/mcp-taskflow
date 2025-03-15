import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { validateSession, checkpointNeeded, verifyScopeCompliance } from "../../utils/validation.js";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "RECORD A FILE SYSTEM CHANGE - YOU MUST CALL THIS AFTER EVERY FILE OPERATION";

// Tool schema
export const schema = schemas.tracking.recordFileChange;

// Tool handler
export async function handler(args: any): Promise<McpResponse> {
  const { sessionId, filePath, changeType } = args;
  
  // Validate session
  const sessionValidation = await validateSession(sessionId);
  if (!sessionValidation.valid) {
    return createResponse(
      false,
      "INVALID SESSION",
      `The session ID provided is invalid or inactive: ${sessionValidation.error}`,
      undefined,
      ["Session validation failed"],
      ["YOU MUST initialize a valid session before recording file changes"]
    );
  }
  
  // Verify scope compliance
  const scopeCheck = await verifyScopeCompliance(sessionId, filePath, changeType);
  if (!scopeCheck.compliant) {
    // Record the scope violation
    await supabase
      .from('scope_validations')
      .insert({
        session_id: sessionId,
        validation_type: 'scope_check',
        result: 'violation',
        details: `File operation outside scope: ${filePath} (${changeType})`,
        timestamp: new Date().toISOString()
      });
      
    // Update compliance score
    await supabase
      .from('sessions')
      .update({
        compliance_score: supabase.rpc('decrement_compliance_score', { session_id: sessionId, amount: 10 })
      })
      .eq('id', sessionId);
      
    return createResponse(
      false,
      "SCOPE VIOLATION DETECTED",
      `The file operation on "${filePath}" appears to be outside your assigned task scope.`,
      undefined,
      ["This operation may not be relevant to your assigned task", "Your compliance score has been reduced"],
      ["YOU MUST justify why this file change is necessary for your specific task", 
       "YOU MUST focus only on files directly related to your assigned task"]
    );
  }
  
  // Record the change in Supabase
  const { error } = await supabase
    .from('file_changes')
    .insert({
      session_id: sessionId,
      file_path: filePath,
      change_type: changeType,
      timestamp: new Date().toISOString()
    });

  if (error) {
    console.error(`Error recording file change: ${error.message}`);
    return createResponse(
      false,
      "FAILED TO RECORD FILE CHANGE",
      `Unable to record the change to "${filePath}". This operation must be logged for accountability.`,
      undefined,
      ["Database error occurred"],
      ["RETRY recording this file change immediately"]
    );
  }
  
  // Update session last_file_change_at timestamp
  await supabase
    .from('sessions')
    .update({
      last_file_change_at: new Date().toISOString()
    })
    .eq('id', sessionId);
  
  // Calculate session stats
  const { data: fileChanges } = await supabase
    .from('file_changes')
    .select('file_path, change_type')
    .eq('session_id', sessionId);
    
  const { data: checkpoints } = await supabase
    .from('checkpoints')
    .select('id')
    .eq('session_id', sessionId);
    
  const { data: decisions } = await supabase
    .from('decisions')
    .select('id')
    .eq('session_id', sessionId);
    
  const { data: snapshots } = await supabase
    .from('snapshots')
    .select('id')
    .eq('session_id', sessionId);
    
  // Group files by path to show a summary
  const fileCounts: Record<string, { created: number, modified: number, deleted: number }> = {};
  
  fileChanges?.forEach(change => {
    if (!fileCounts[change.file_path]) {
      fileCounts[change.file_path] = { created: 0, modified: 0, deleted: 0 };
    }
    fileCounts[change.file_path][change.change_type as 'created' | 'modified' | 'deleted']++;
  });
  
  // Create a files modified summary
  const filesSummary = Object.entries(fileCounts).map(([path, counts]) => 
    `- ${path}: ${counts.created ? counts.created + ' creates, ' : ''}${counts.modified ? counts.modified + ' modifications, ' : ''}${counts.deleted ? counts.deleted + ' deletions' : ''}`
  ).join('\n');
  
  // Check if checkpoint is needed
  const needsCheckpoint = await checkpointNeeded(sessionId);
  
  // Get task context
  const { data: session } = await supabase
    .from('sessions')
    .select('task_id, compliance_score')
    .eq('id', sessionId)
    .single();
    
  // Get task name if available
  let taskName = '';
  if (session?.task_id) {
    const { data: taskData } = await supabase
      .from('tasks')
      .select('name')
      .eq('id', session.task_id)
      .single();
      
    if (taskData) {
      taskName = taskData.name;
    }
  }
  
  // Prepare guidance based on context
  const warnings = [];
  const actions = [];
  
  if (needsCheckpoint) {
    warnings.push("You have not created a checkpoint recently");
    actions.push("YOU MUST create a checkpoint immediately");
  }
  
  if ((decisions?.length || 0) < 1) {
    warnings.push("You have not logged any key decisions yet");
    actions.push("YOU MUST document important decisions using MUST-LOG-ALL-DECISIONS");
  }
  
  if (changeType === 'modified' && (snapshots?.length || 0) < 1) {
    warnings.push("You have modified files but haven't created any snapshots");
    actions.push("Consider creating a snapshot of significant file versions");
  }
  
  // Reminder about staying in scope
  if (taskName) {
    actions.push(`YOU MUST stay within the scope of task "${taskName}"`);
  }
  
  return createResponse(
    true,
    `FILE ${changeType.toUpperCase()} RECORDED`,
    `The ${changeType} operation on "${filePath}" has been successfully logged.`,
    {
      "Files changed": fileChanges?.length || 0,
      "Checkpoints": checkpoints?.length || 0,
      "Decisions": decisions?.length || 0,
      "Snapshots": snapshots?.length || 0,
      "Compliance score": `${session?.compliance_score || 100}/100`
    },
    warnings,
    actions
  );
} 