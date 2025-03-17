import { createResponse } from '../../utils/responses.js';
import supabase from '../../lib/supabase-client.js';
import { z } from 'zod';
import { schemas } from '../../utils/responses.js';
import { Database } from '../../lib/types';
import { formatDuration } from '../../utils/formatting.js';

type Session = Database['public']['Tables']['sessions']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Feature = Database['public']['Tables']['features']['Row'];
type Checkpoint = Database['public']['Tables']['checkpoints']['Row'];
type Snapshot = Database['public']['Tables']['snapshots']['Row'];
type Decision = Database['public']['Tables']['decisions']['Row'];

// Tool description
export const description = "YOU MUST RETRIEVE COMPLETE SESSION HISTORY FOR ACCURATE TASK CONTEXT - FAILURE TO EXAMINE PREVIOUS SESSIONS WILL LEAD TO REDUNDANT WORK AND IMPLEMENTATION INCONSISTENCIES";

// Tool schema
export const schema = z.object(schemas.application.getSessionHistory);

// Define content types that MCP server expects
type TextContent = {
  type: "text";
  text: string;
};

type ImageContent = {
  type: "image";
  data: string;
  mimeType: string;
};

type ResourceContent = {
  type: "resource";
  resource: {
    text: string;
    uri: string;
    mimeType?: string;
  };
};

type ContentItem = TextContent | ImageContent | ResourceContent;

export type McpResponse = {
  content: ContentItem[];
  [key: string]: any;
};

// Helper function to format session data
function formatSessionData(session: Session, checkpoints: Checkpoint[], snapshots: Snapshot[], decisions: Decision[]): string {
  const duration = session.end_time 
    ? formatDuration(new Date(session.end_time).getTime() - new Date(session.start_time).getTime())
    : 'In Progress';

  const checkpointSummary = checkpoints
    .map(c => `- ${new Date(c.timestamp).toLocaleString()}: ${c.progress}`)
    .join('\n');

  const snapshotSummary = snapshots
    .map(s => `- ${new Date(s.timestamp).toLocaleString()}: ${s.file_path}`)
    .join('\n');

  const decisionSummary = decisions
    .map(d => `- ${new Date(d.timestamp).toLocaleString()}: ${d.description}\n  Reasoning: ${d.reasoning}`)
    .join('\n');

  return `### Session ${session.id}
- **Start Time**: ${new Date(session.start_time).toLocaleString()}
- **End Time**: ${session.end_time ? new Date(session.end_time).toLocaleString() : 'In Progress'}
- **Duration**: ${duration}
- **Task Type**: ${session.task_type}
- **Status**: ${session.status}
- **Compliance Score**: ${session.compliance_score}/100

#### Progress Checkpoints
${checkpointSummary || '*No checkpoints recorded*'}

#### File Snapshots
${snapshotSummary || '*No snapshots recorded*'}

#### Key Decisions
${decisionSummary || '*No decisions recorded*'}

---`;
}

// Tool handler
export async function handler(params: z.infer<typeof schema>): Promise<McpResponse> {
  try {
    // Validate required parameters
    if (!params.taskId) {
      return createResponse(
        false,
        'Missing task ID',
        'Please provide a task ID',
        undefined,
        ['Required parameter taskId is missing'],
        ['Provide a valid task ID to retrieve session history']
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
        'Please check the task ID',
        undefined,
        ['Task could not be found', 'Database query failed'],
        ['Verify the task ID is correct', 'Check if the task still exists']
      );
    }

    // Get all sessions for this task
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('task_id', params.taskId)
      .order('start_time', { ascending: false });

    if (sessionsError) {
      return createResponse(
        false,
        'Failed to retrieve sessions',
        'Error retrieving session data',
        undefined,
        ['Database query for sessions failed'],
        ['Check database connection', 'Try again later']
      );
    }

    // Get all checkpoints for these sessions
    const sessionIds = sessions?.map((s: Session) => s.id) || [];
    const { data: checkpoints, error: checkpointsError } = await supabase
      .from('checkpoints')
      .select('*')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: true });

    if (checkpointsError) {
      return createResponse(
        false,
        'Failed to retrieve checkpoints',
        'Error retrieving checkpoint data',
        undefined,
        ['Database query for checkpoints failed'],
        ['Check database connection', 'Try again later']
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
        'Error retrieving snapshot data',
        undefined,
        ['Database query for snapshots failed'],
        ['Check database connection', 'Try again later']
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
        'Error retrieving decision data',
        undefined,
        ['Database query for decisions failed'],
        ['Check database connection', 'Try again later']
      );
    }

    // Calculate total duration and completion metrics
    let totalDurationMs = 0;
    let completedSessions = 0;
    let totalCheckpoints = 0;
    let totalSnapshots = 0;
    let totalDecisions = 0;
    let averageComplianceScore = 0;

    sessions?.forEach((session: Session) => {
      if (session.end_time) {
        totalDurationMs += new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
        completedSessions++;
      }
      averageComplianceScore += session.compliance_score || 0;
    });

    averageComplianceScore = sessions?.length ? Math.round(averageComplianceScore / sessions.length) : 0;

    // Format session history in Markdown
    const formattedHistory = sessions?.map((session: Session) => {
      const sessionCheckpoints = checkpoints?.filter((c: any) => c.session_id === session.id) || [];
      const sessionSnapshots = snapshots?.filter((s: any) => s.session_id === session.id) || [];
      const sessionDecisions = decisions?.filter((d: any) => d.session_id === session.id) || [];

      totalCheckpoints += sessionCheckpoints.length;
      totalSnapshots += sessionSnapshots.length;
      totalDecisions += sessionDecisions.length;

      return formatSessionData(session, sessionCheckpoints, sessionSnapshots, sessionDecisions);
    }).join('\n\n') || '*No sessions found*';

    // Prepare task context
    const taskContext = `# Task History: ${task.name}
## Task Details
- **Status**: ${task.status}
- **Priority**: ${task.priority}
- **Feature**: ${task.features.name}
${task.description ? `\n**Description**:\n${task.description}` : ''}
${task.acceptance_criteria ? `\n**Acceptance Criteria**:\n${task.acceptance_criteria}` : ''}

## Session History
${formattedHistory}

## Summary Statistics
- Total Sessions: ${sessions?.length || 0}
- Completed Sessions: ${completedSessions}
- Active Sessions: ${(sessions?.length || 0) - completedSessions}
- Total Duration: ${formatDuration(totalDurationMs)}
- Total Checkpoints: ${totalCheckpoints}
- Total Snapshots: ${totalSnapshots}
- Total Decisions: ${totalDecisions}
- Average Compliance Score: ${averageComplianceScore}/100`;

    // Prepare next actions based on history
    const nextActions = [];
    
    if (!sessions?.length) {
      nextActions.push('Start your first session for this task');
    } else if (!sessions.some(s => s.end_time === null)) {
      nextActions.push('Start a new session to continue work');
    }

    if (totalCheckpoints === 0) {
      nextActions.push('Create progress checkpoints during your sessions');
    }

    if (totalSnapshots === 0) {
      nextActions.push('Take snapshots of important file states');
    }

    if (totalDecisions === 0) {
      nextActions.push('Document key decisions made during implementation');
    }

    return createResponse(
      true,
      'Session history retrieved successfully',
      taskContext,
      {
        task,
        feature: task.features,
        sessions: sessions?.length || 0,
        completed_sessions: completedSessions,
        active_sessions: (sessions?.length || 0) - completedSessions,
        total_duration: formatDuration(totalDurationMs),
        total_checkpoints: totalCheckpoints,
        total_snapshots: totalSnapshots,
        total_decisions: totalDecisions,
        average_compliance_score: averageComplianceScore
      },
      [],
      nextActions
    );
  } catch (err) {
    console.error('Error retrieving session history:', err);
    return createResponse(
      false,
      'Failed to retrieve session history',
      'An unexpected error occurred',
      undefined,
      ['Internal server error', 'Session history could not be retrieved'],
      ['Check server logs for details', 'Try again later']
    );
  }
} 