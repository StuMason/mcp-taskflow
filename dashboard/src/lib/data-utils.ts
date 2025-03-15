import supabase from './supabase-client';
import type { Application, Feature, Task, Session, FileChange, Checkpoint, Snapshot, Decision } from './types';

// Applications
export async function getApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
  
  return data || [];
}

// Features
export async function getFeatures(applicationId?: string): Promise<Feature[]> {
  let query = supabase
    .from('features')
    .select('*')
    .order('priority', { ascending: false });
  
  if (applicationId) {
    query = query.eq('application_id', applicationId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching features:', error);
    return [];
  }
  
  return data || [];
}

// Tasks
export async function getTasks(featureId?: string): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('priority', { ascending: false });
  
  if (featureId) {
    query = query.eq('feature_id', featureId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  
  return data || [];
}

// Sessions
export async function getSessions(taskId?: string): Promise<Session[]> {
  let query = supabase
    .from('sessions')
    .select('*')
    .order('start_time', { ascending: false });
  
  if (taskId) {
    query = query.eq('task_id', taskId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
  
  return data || [];
}

// File Changes
export async function getFileChanges(sessionId?: string): Promise<FileChange[]> {
  let query = supabase
    .from('file_changes')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching file changes:', error);
    return [];
  }
  
  return data || [];
}

// Checkpoints
export async function getCheckpoints(sessionId?: string): Promise<Checkpoint[]> {
  let query = supabase
    .from('checkpoints')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching checkpoints:', error);
    return [];
  }
  
  return data || [];
}

// Snapshots
export async function getSnapshots(sessionId?: string): Promise<Snapshot[]> {
  let query = supabase
    .from('snapshots')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching snapshots:', error);
    return [];
  }
  
  return data || [];
}

// Decisions
export async function getDecisions(sessionId?: string): Promise<Decision[]> {
  let query = supabase
    .from('decisions')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching decisions:', error);
    return [];
  }
  
  return data || [];
} 