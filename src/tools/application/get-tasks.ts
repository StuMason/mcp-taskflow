import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";
import { Database } from '../../lib/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type Session = Database['public']['Tables']['sessions']['Row'];

interface SessionStats {
  total: number;
  active: number;
  completed: number;
  total_duration_ms: number;
  total_duration: string;
}

// Tool description
export const description = "YOU MUST GET ALL TASKS FOR A FEATURE - COMPREHENSIVE TASK AWARENESS IS ESSENTIAL FOR PROPER IMPLEMENTATION SEQUENCING AND WORKFLOW COMPLIANCE";

// Tool schema
export const schema = z.object(schemas.application.getTasks);

// Tool handler
export async function handler(params: z.infer<typeof schema>): Promise<McpResponse> {
  try {
    // Validate required parameters
    if (!params.featureId) {
      return createResponse(
        false,
        'Missing feature ID',
        'Please provide a feature ID'
      );
    }

    // Get feature and application context
    const { data: feature, error: featureError } = await supabase
      .from("features")
      .select(`
        *,
        applications (
          id,
          name,
          description
        )
      `)
      .eq("id", params.featureId)
      .maybeSingle();

    if (featureError) {
      return createResponse(
        false,
        "Failed to Retrieve Tasks",
        `Error checking feature existence: ${featureError.message}`,
        undefined,
        ["Database operation failed", "Feature may not exist"],
        ["Verify the feature ID is correct", "Use MUST-GET-FEATURES to list available features"]
      );
    }

    if (!feature) {
      return createResponse(
        false,
        "Failed to Retrieve Tasks",
        `Feature with ID ${params.featureId} does not exist`,
        undefined,
        ["The specified feature ID was not found", "Tasks must be retrieved from an existing feature"],
        ["Use MUST-GET-FEATURES to list available features", "Create the feature first using MUST-CREATE-FEATURE-PROPERLY"]
      );
    }

    // Get tasks for the feature
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, features(*)')
      .eq('feature_id', params.featureId);

    if (tasksError) {
      return createResponse(
        false,
        'Failed to retrieve tasks',
        'Please try again'
      );
    }

    // Get sessions for each task
    const taskIds = tasks?.map(t => t.id) || [];
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .in('task_id', taskIds);

    // Calculate task statistics
    const taskStats = {
      total: tasks?.length || 0,
      backlog: tasks?.filter(t => t.status === 'backlog').length || 0,
      ready: tasks?.filter(t => t.status === 'ready').length || 0,
      in_progress: tasks?.filter(t => t.status === 'in_progress').length || 0,
      in_review: tasks?.filter(t => t.status === 'in_review').length || 0,
      completed: tasks?.filter(t => t.status === 'completed').length || 0
    };

    // Calculate session statistics
    const sessionStats: SessionStats = {
      total: sessions?.length || 0,
      active: sessions?.filter(s => !s.end_time).length || 0,
      completed: sessions?.filter(s => s.end_time).length || 0,
      total_duration_ms: sessions?.reduce((sum, s) => {
        if (s.end_time) {
          return sum + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime());
        }
        return sum;
      }, 0) || 0,
      total_duration: ''
    };

    // Format duration
    sessionStats.total_duration = formatDuration(sessionStats.total_duration_ms);

    // Get the last session
    const lastSession = sessions?.length ? sessions[sessions.length - 1] : null;
    const lastActive = lastSession && !lastSession.end_time;

    // Generate next actions based on task states
    const nextActions: string[] = [];

    // Add actions based on task status
    if (taskStats.backlog > 0) {
      nextActions.push('Move tasks from backlog to ready');
    }

    if (taskStats.ready > 0) {
      nextActions.push('Start working on ready tasks');
    }

    if (taskStats.in_review > 0) {
      nextActions.push('Review completed tasks');
    }

    // Add actions based on session state
    if (lastActive) {
      nextActions.push('Complete the active session');
    }

    return createResponse(
      true,
      'Tasks retrieved successfully',
      'Here are all tasks for this feature',
      {
        tasks: tasks?.map(task => ({
          ...task,
          sessions: sessions?.filter(s => s.task_id === task.id) || []
        })),
        feature: tasks?.[0]?.features,
        stats: {
          tasks: taskStats,
          sessions: sessionStats
        },
        last_active: lastActive,
        next_actions: nextActions,
        retrieval_time: new Date().toISOString()
      }
    );
  } catch (err) {
    console.error('Error retrieving tasks:', err);
    return createResponse(
      false,
      'Failed to retrieve tasks',
      'An unexpected error occurred'
    );
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
} 