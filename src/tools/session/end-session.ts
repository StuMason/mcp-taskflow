import { createResponse } from '../../utils/responses.js';
import supabase from '../../lib/supabase-client.js';
import { Database } from '../../lib/types';

type Session = Database['public']['Tables']['sessions']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

export async function endSession(params: { sessionId: string; summary: string }) {
  try {
    // Validate required parameters
    if (!params.sessionId) {
      return createResponse(
        false,
        'Missing session ID',
        'Please provide a session ID'
      );
    }

    if (!params.summary) {
      return createResponse(
        false,
        'Missing summary',
        'Please provide a summary of what was accomplished'
      );
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, tasks(*)')
      .eq('id', params.sessionId)
      .single();

    if (sessionError || !session) {
      return createResponse(
        false,
        'Session not found',
        'Please check the session ID'
      );
    }

    // Update session with end time and summary
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        timestamp: new Date().toISOString(),
        summary: params.summary
      })
      .eq('id', params.sessionId);

    if (updateError) {
      return createResponse(
        false,
        'Failed to end session',
        'Please try again'
      );
    }

    // If task was in progress, update its status
    if (session.tasks.status === 'in_progress') {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'in_review' })
        .eq('id', session.task_id);

      if (taskError) {
        return createResponse(
          false,
          'Failed to update task status',
          'Please try again'
        );
      }
    }

    // Get session statistics
    const { data: checkpoints } = await supabase
      .from('checkpoints')
      .select('*')
      .eq('session_id', params.sessionId);

    const { data: snapshots } = await supabase
      .from('snapshots')
      .select('*')
      .eq('session_id', params.sessionId);

    const { data: decisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('session_id', params.sessionId);

    const stats = {
      total_checkpoints: checkpoints?.length || 0,
      total_snapshots: snapshots?.length || 0,
      total_decisions: decisions?.length || 0
    };

    // Generate prompts for next task
    const nextPrompts = [
      'Review the changes made in this session',
      'Update documentation if needed',
      'Consider creating tests for the changes'
    ];

    if (session.tasks.status === 'in_review') {
      nextPrompts.push('Request code review from team members');
    }

    return createResponse(
      true,
      'Session ended successfully',
      'You can now start a new session or continue with other tasks',
      {
        session: {
          id: session.id,
          task_id: session.task_id,
          summary: params.summary,
          end_time: new Date().toISOString()
        },
        task: session.tasks,
        stats,
        next_prompts: nextPrompts
      }
    );
  } catch (err) {
    console.error('Error ending session:', err);
    return createResponse(
      false,
      'Failed to end session',
      'An unexpected error occurred'
    );
  }
} 