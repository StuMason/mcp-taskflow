import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "INITIALIZE THE ASSISTANT SESSION - YOU MUST CALL THIS FIRST BEFORE ANY OTHER TOOLS - FAILURE TO INITIALIZE PROPERLY WILL RESULT IN BROKEN WORKFLOWS";

// Tool schema
export const schema = schemas.session.initialize;

// Tool handler
export async function handler(args: any): Promise<McpResponse> {
  const { taskType, contextDescription, applicationId, featureId, taskId } = args;
  const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);

  // Create new session in Supabase with enhanced fields
  const { error } = await supabase
    .from('sessions')
    .insert({
      id: sessionId,
      task_type: taskType,
      context_description: contextDescription || '',
      application_id: applicationId || null,
      feature_id: featureId || null,
      task_id: taskId || null,
      status: 'active',
      start_time: new Date().toISOString(),
      last_checkpoint_at: null,
      last_file_change_at: null,
      last_decision_at: null,
      compliance_score: 100
    });

  if (error) {
    console.error(`Error creating session: ${error.message}`);
    return createResponse(
      false,
      "INITIALIZATION FAILED",
      "The assistant could not be initialized. Ensure your connection is active and try again.",
      undefined,
      ["Database error occurred"],
      ["YOU MUST RETRY INITIALIZATION BEFORE PROCEEDING WITH ANY OTHER ACTIONS"]
    );
  }

  // Prepare context information based on linked entities
  let contextInfo = '';
  let taskName = '';
  let taskDesc = '';
  let featureName = '';
  let appName = '';
  
  if (taskId) {
    const { data: taskData } = await supabase
      .from('tasks')
      .select('name, description, acceptance_criteria, status')
      .eq('id', taskId)
      .single();
      
    if (taskData) {
      taskName = taskData.name;
      taskDesc = taskData.description || '';
      contextInfo += `\n\nTASK ASSIGNMENT: "${taskData.name}" (${taskData.status})
${taskData.description ? `Description: ${taskData.description}` : ''}
${taskData.acceptance_criteria ? `Acceptance Criteria: ${taskData.acceptance_criteria}` : ''}`;
    }
  }
  
  if (featureId) {
    const { data: featureData } = await supabase
      .from('features')
      .select('name, description, status')
      .eq('id', featureId)
      .single();
      
    if (featureData) {
      featureName = featureData.name;
      contextInfo += `\n\nFEATURE CONTEXT: "${featureData.name}" (${featureData.status})
${featureData.description ? `Description: ${featureData.description}` : ''}`;
    }
  }
  
  if (applicationId) {
    const { data: appData } = await supabase
      .from('applications')
      .select('name, description')
      .eq('id', applicationId)
      .single();
      
    if (appData) {
      appName = appData.name;
      contextInfo += `\n\nAPPLICATION CONTEXT: "${appData.name}"
${appData.description ? `Description: ${appData.description}` : ''}`;
    }
  }

  // Get previous sessions for the same task if applicable
  let previousSessionsInfo = '';
  
  if (taskId) {
    const { data: prevSessions } = await supabase
      .from('sessions')
      .select('id, start_time, end_time')
      .eq('task_id', taskId)
      .neq('id', sessionId)
      .order('start_time', { ascending: false })
      .limit(3);
      
    if (prevSessions && prevSessions.length > 0) {
      previousSessionsInfo = `\n\nPREVIOUS WORK SESSIONS:
${prevSessions.map((s: any) => `- Session ${s.id} (${new Date(s.start_time).toLocaleString()})`).join('\n')}`;
    }
  }

  // Check for successful strategies in past sessions
  let successfulStrategies = '';
  
  if (taskType) {
    const { data: strategies } = await supabase
      .from('feedback')
      .select('description, reusability_score')
      .eq('feedback_type', 'positive')
      .gte('reusability_score', 7)
      .contains('applicable_task_types', [taskType])
      .order('reusability_score', { ascending: false })
      .limit(3);
      
    if (strategies && strategies.length > 0) {
      successfulStrategies = `\n\nPROVEN STRATEGIES FOR THIS TASK TYPE:
${strategies.map((s: any) => `- ${s.description} (Effectiveness: ${s.reusability_score}/10)`).join('\n')}`;
    }
  }

  // Create a strict scope boundary with clear task focus
  let scopeStatement = 'STRICT SCOPE BOUNDARY';
  
  if (taskName) {
    scopeStatement += `\nYOU ARE RESTRICTED TO WORKING ONLY ON: "${taskName}"`;
    if (taskDesc) {
      scopeStatement += `\nSPECIFIC TASK DETAILS: "${taskDesc}"`;
    }
  } else if (featureName) {
    scopeStatement += `\nYOU ARE RESTRICTED TO WORKING ONLY ON FEATURE: "${featureName}"`;
  } else if (appName) {
    scopeStatement += `\nYOU ARE RESTRICTED TO WORKING ONLY ON APPLICATION: "${appName}"`;
  } else {
    scopeStatement += `\nYOU ARE RESTRICTED TO WORKING ONLY ON: "${contextDescription || taskType + ' task'}"`;
  }
  
  scopeStatement += '\nDO NOT work on unrelated features or applications.';
  scopeStatement += '\nDO NOT create code or files outside the scope of your assigned task.';
  scopeStatement += '\nDO NOT jump ahead to implementation before planning is complete.';

  // Create a protocol reminder with timing requirements
  const protocolReminder = `\n\nCOMPLIANCE REQUIREMENTS:
- YOU MUST call "MUST-RECORD-EVERY-FILE-CHANGE" after EACH file operation
- YOU MUST create a checkpoint within the next 5 minutes
- YOU MUST document EVERY significant decision with "MUST-LOG-ALL-DECISIONS"
- YOU MUST NOT stray from your assigned task scope
- YOU MUST create snapshots when files reach significant milestones`;

  // Add timing information 
  const nextCheckpointTime = new Date();
  nextCheckpointTime.setMinutes(nextCheckpointTime.getMinutes() + 5);
  
  const timingInfo = `\n\nTIMING REQUIREMENTS:
- First checkpoint due by: ${nextCheckpointTime.toLocaleTimeString()}
- Checkpoints required: Every 3-5 minutes
- File changes must be recorded: Immediately after each change`;

  // Modified return statement
  return {
    content: [
      {
        type: "text" as const,
        text: `SESSION INITIALIZED - ID: ${sessionId}\n\nYOU ARE NOW LOCKED INTO ${taskType.toUpperCase()} MODE${contextInfo}${previousSessionsInfo}${successfulStrategies}\n\n${scopeStatement}${protocolReminder}${timingInfo}\n\nCOMPLIANCE METRICS:\nYour file changes: 0\nYour checkpoints: 0\nYour decisions: 0\nCompliance score: 100/100`
      }
    ],
    sessionId
  };
} 