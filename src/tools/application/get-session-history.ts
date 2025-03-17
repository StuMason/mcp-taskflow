import { createResponse } from '../../utils/responses.js';
import supabase from '../../lib/supabase-client.js';
import { z } from 'zod';
import { schemas } from '../../utils/responses.js';
import { Database } from '../../lib/types';

type Session = Database['public']['Tables']['sessions']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Feature = Database['public']['Tables']['features']['Row'];

// Tool description
export const description = "YOU MUST RETRIEVE COMPLETE SESSION HISTORY FOR ACCURATE TASK CONTEXT - FAILURE TO EXAMINE PREVIOUS SESSIONS WILL LEAD TO REDUNDANT WORK AND IMPLEMENTATION INCONSISTENCIES";

// Tool schema
export const schema = z.object(schemas.application.getSessionHistory);

export type McpResponse = {
  success: boolean;
  title: string;
  message: string;
  data?: any;
  warnings?: string[];
  next_actions?: string[];
};

// Tool handler
export async function handler(params: z.infer<typeof schema>): Promise<McpResponse> {
  try {
    // Validate required parameters
    if (!params.taskId) {
      return {
        success: false,
        title: 'Missing task ID',
        message: 'Please provide a task ID'
      };
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*, features(*)')
      .eq('id', params.taskId)
      .single();

    if (taskError || !task) {
      return {
        success: false,
        title: 'Task not found',
        message: 'Please check the task ID'
      };
    }

    // Get all sessions for this task
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('task_id', params.taskId)
      .order('start_time', { ascending: false });

    if (sessionsError) {
      return {
        success: false,
        title: 'Failed to retrieve sessions',
        message: 'Please try again'
      };
    }

    // Get all checkpoints for these sessions
    const sessionIds = sessions?.map((s: Session) => s.id) || [];
    const { data: checkpoints, error: checkpointsError } = await supabase
      .from('checkpoints')
      .select('*')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: true });

    if (checkpointsError) {
      return {
        success: false,
        title: 'Failed to retrieve checkpoints',
        message: 'Please try again'
      };
    }

    // Get all snapshots for these sessions
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('snapshots')
      .select('*')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: true });

    if (snapshotsError) {
      return {
        success: false,
        title: 'Failed to retrieve snapshots',
        message: 'Please try again'
      };
    }

    // Get all decisions for these sessions
    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('*')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: true });

    if (decisionsError) {
      return {
        success: false,
        title: 'Failed to retrieve decisions',
        message: 'Please try again'
      };
    }

    // Organize sessions with their related data
    const sessionHistory = sessions?.map((session: Session) => ({
      ...session,
      checkpoints: checkpoints?.filter((c: any) => c.session_id === session.id) || [],
      snapshots: snapshots?.filter((s: any) => s.session_id === session.id) || [],
      decisions: decisions?.filter((d: any) => d.session_id === session.id) || []
    })) || [];

    return {
      success: true,
      title: 'Session history retrieved successfully',
      message: 'Here is the complete history for this task',
      data: {
        task,
        feature: task.features,
        sessions: sessionHistory,
        total_sessions: sessionHistory.length,
        total_checkpoints: checkpoints?.length || 0,
        total_snapshots: snapshots?.length || 0,
        total_decisions: decisions?.length || 0
      }
    };
  } catch (err) {
    console.error('Error retrieving session history:', err);
    return {
      success: false,
      title: 'Failed to retrieve session history',
      message: 'An unexpected error occurred'
    };
  }
} 