import supabase from "../lib/supabase-client.js";

// Check if session exists and is active
export async function validateSession(sessionId: string) {
  if (!sessionId) {
    return {
      valid: false,
      error: "No session ID provided"
    };
  }
  
  const { data, error } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', sessionId)
    .single();
    
  if (error || !data) {
    return {
      valid: false,
      error: "Session not found"
    };
  }
  
  if (data.status !== 'active') {
    return {
      valid: false,
      error: `Session is ${data.status}, not active`
    };
  }
  
  return {
    valid: true,
    data
  };
}

// Check if checkpoint is needed
export async function checkpointNeeded(sessionId: string) {
  const { data } = await supabase
    .from('sessions')
    .select('last_checkpoint_at, start_time')
    .eq('id', sessionId)
    .single();
    
  if (!data) return true;
  
  const lastCheckpoint = data.last_checkpoint_at 
    ? new Date(data.last_checkpoint_at) 
    : new Date(data.start_time);
    
  const minutesSinceLastCheckpoint = (Date.now() - lastCheckpoint.getTime()) / 60000;
  
  return minutesSinceLastCheckpoint >= 3;
}

// Verify task scope compliance
export async function verifyScopeCompliance(sessionId: string, filePath: string, operation: string) {
  // This would contain logic to check if the file operation is within scope
  // For example, checking if the file is part of the assigned task
  
  // Basic implementation example:
  const { data: session } = await supabase
    .from('sessions')
    .select('task_id, application_id, feature_id')
    .eq('id', sessionId)
    .single();
    
  if (!session) return { compliant: false, reason: "Session not found" };
  
  // Here you would implement logic to determine if the file path
  // is relevant to the task/feature/application in the session
  
  // For now, we'll return a simple mock result
  return { compliant: true };
} 