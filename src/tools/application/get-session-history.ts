import { createResponse } from '../../utils/response';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/types';

type Session = Database['public']['Tables']['sessions']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Feature = Database['public']['Tables']['features']['Row'];

// Tool description
export const description = "YOU MUST RETRIEVE COMPLETE SESSION HISTORY FOR ACCURATE TASK CONTEXT - FAILURE TO EXAMINE PREVIOUS SESSIONS WILL LEAD TO REDUNDANT WORK AND IMPLEMENTATION INCONSISTENCIES";

// Tool schema
export const schema = z.object(schemas.application.getSessionHistory);

// Tool handler
export async function handler(params: z.infer<typeof schema>): Promise<McpResponse> {
  try {
    // Validate required parameters
    if (!params.taskId) {
      return createResponse(
        false,
        'Missing task ID',
        'Please provide a task ID'
      );
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*, features(*)')
      .eq('id', params.taskId)
      .single();

    if (taskError || !task) {
      return createResponse(
        false,
        'Task not found',
        'Please check the task ID'
      );
    }

    // Get all sessions for this task
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('task_id', params.taskId)
      .order('timestamp', { ascending: false });

    if (sessionsError) {
      return createResponse(
        false,
        'Failed to retrieve sessions',
        'Please try again'
      );
    }

    // Get all checkpoints for these sessions
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: checkpoints, error: checkpointsError } = await supabase
      .from('checkpoints')
      .select('*')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: true });

    if (checkpointsError) {
      return createResponse(
        false,
        'Failed to retrieve checkpoints',
        'Please try again'
      );
    }

    // Get all snapshots for these sessions
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('snapshots')
      .select('*')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: true });

    if (snapshotsError) {
      return createResponse(
        false,
        'Failed to retrieve snapshots',
        'Please try again'
      );
    }

    // Get all decisions for these sessions
    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('*')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: true });

    if (decisionsError) {
      return createResponse(
        false,
        'Failed to retrieve decisions',
        'Please try again'
      );
    }

    // Organize sessions with their related data
    const sessionHistory = sessions?.map(session => ({
      ...session,
      checkpoints: checkpoints?.filter(c => c.session_id === session.id) || [],
      snapshots: snapshots?.filter(s => s.session_id === session.id) || [],
      decisions: decisions?.filter(d => d.session_id === session.id) || []
    })) || [];

    return createResponse(
      true,
      'Session history retrieved successfully',
      'Here is the complete history for this task',
      {
        task,
        feature: task.features,
        sessions: sessionHistory,
        total_sessions: sessionHistory.length,
        total_checkpoints: checkpoints?.length || 0,
        total_snapshots: snapshots?.length || 0,
        total_decisions: decisions?.length || 0
      }
    );
  } catch (err) {
    console.error('Error retrieving session history:', err);
    return createResponse(
      false,
      'Failed to retrieve session history',
      'An unexpected error occurred'
    );
  }
} 