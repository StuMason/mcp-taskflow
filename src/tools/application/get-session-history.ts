import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST RETRIEVE COMPLETE SESSION HISTORY FOR ACCURATE TASK CONTEXT - FAILURE TO EXAMINE PREVIOUS SESSIONS WILL LEAD TO REDUNDANT WORK AND IMPLEMENTATION INCONSISTENCIES";

// Tool schema
export const schema = z.object(schemas.application.getSessionHistory);

// Tool handler
export async function handler(params: z.infer<typeof schema>): Promise<McpResponse> {
  try {
    // Get task and feature context
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select(`
        *,
        features (
          id,
          name,
          description,
          status,
          applications (
            id,
            name,
            description
          )
        )
      `)
      .eq("id", params.taskId)
      .maybeSingle();

    if (taskError) {
      return createResponse(
        false,
        "Failed to Retrieve Session History",
        `Error checking task existence: ${taskError.message}`,
        undefined,
        ["Database operation failed", "Task may not exist"],
        ["Verify the task ID is correct", "Use MUST-GET-TASKS to list available tasks"]
      );
    }

    if (!task) {
      return createResponse(
        false,
        "Failed to Retrieve Session History",
        `Task with ID ${params.taskId} does not exist`,
        undefined,
        ["The specified task ID was not found", "Session history must be retrieved for an existing task"],
        ["Use MUST-GET-TASKS to list available tasks", "Create the task first using MUST-CREATE-TASK-PROPERLY"]
      );
    }

    // Query the sessions with their related data
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(`
        *,
        progress_checkpoints (
          id,
          progress,
          changes_description,
          current_thinking,
          next_steps,
          created_at
        ),
        file_changes (
          id,
          file_path,
          change_type,
          created_at
        ),
        decisions (
          id,
          description,
          reasoning,
          alternatives,
          created_at
        ),
        snapshots (
          id,
          file_path,
          content_hash,
          created_at
        )
      `)
      .eq("task_id", params.taskId)
      .order("created_at", { ascending: false });

    if (sessionsError) {
      return createResponse(
        false,
        "Failed to Retrieve Session History",
        `Error retrieving sessions: ${sessionsError.message}`,
        undefined,
        ["Database operation failed", "Session history could not be retrieved"],
        ["Check database connection", "Try again in a few moments"]
      );
    }

    // Calculate statistics for each session
    const sessionsWithStats = sessions.map(session => {
      const checkpoints = session.progress_checkpoints || [];
      const fileChanges = session.file_changes || [];
      const decisions = session.decisions || [];
      const snapshots = session.snapshots || [];

      const duration = session.end_time && session.start_time ?
        new Date(session.end_time).getTime() - new Date(session.start_time).getTime() :
        null;

      return {
        ...session,
        stats: {
          duration_ms: duration,
          checkpoints: {
            total: checkpoints.length,
            timeline: checkpoints.map(c => ({
              time: c.created_at,
              progress: c.progress
            }))
          },
          file_changes: {
            total: fileChanges.length,
            created: fileChanges.filter(f => f.change_type === "created").length,
            modified: fileChanges.filter(f => f.change_type === "modified").length,
            deleted: fileChanges.filter(f => f.change_type === "deleted").length
          },
          decisions: {
            total: decisions.length,
            timeline: decisions.map(d => ({
              time: d.created_at,
              description: d.description
            }))
          },
          snapshots: {
            total: snapshots.length,
            timeline: snapshots.map(s => ({
              time: s.created_at,
              file: s.file_path
            }))
          }
        }
      };
    });

    // Generate warnings based on session history
    const warnings = [];
    if (sessionsWithStats.length === 0) {
      warnings.push("No sessions found - YOU MUST initialize a session to begin work");
    } else {
      const incompleteSessions = sessionsWithStats.filter(s => !s.end_time);
      if (incompleteSessions.length > 0) {
        warnings.push(`${incompleteSessions.length} sessions were not properly ended`);
      }

      const lowComplianceSessions = sessionsWithStats.filter(s => s.compliance_score < 80);
      if (lowComplianceSessions.length > 0) {
        warnings.push(`${lowComplianceSessions.length} sessions had low compliance scores (<80)`);
      }

      const noCheckpointSessions = sessionsWithStats.filter(s => s.stats.checkpoints.total === 0);
      if (noCheckpointSessions.length > 0) {
        warnings.push(`${noCheckpointSessions.length} sessions had no progress checkpoints`);
      }

      const noDecisionSessions = sessionsWithStats.filter(s => s.stats.decisions.total === 0);
      if (noDecisionSessions.length > 0) {
        warnings.push(`${noDecisionSessions.length} sessions had no recorded decisions`);
      }
    }

    // Generate next actions based on history
    const nextActions = [];
    if (sessionsWithStats.length === 0) {
      nextActions.push("Initialize your first session using MUST-INITIALIZE-SESSION");
      nextActions.push("Set clear goals for the session");
    } else {
      nextActions.push("Review previous session summaries for context");
      nextActions.push("Initialize a new session using MUST-INITIALIZE-SESSION");
      
      const lastSession = sessionsWithStats[0];
      if (!lastSession.end_time) {
        nextActions.push("Properly end the last session using MUST-END-SESSION-PROPERLY");
      }
      
      if (lastSession.stats.checkpoints.total === 0) {
        nextActions.push("Ensure you create regular progress checkpoints in your next session");
      }
      
      if (lastSession.stats.decisions.total === 0) {
        nextActions.push("Document important decisions in your next session");
      }
    }

    return createResponse(
      true,
      "Session History Retrieved",
      `Successfully retrieved ${sessions.length} sessions for task '${task.name}'`,
      {
        task: {
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          priority: task.priority,
          acceptance_criteria: task.acceptance_criteria,
          feature: task.features,
          application: task.features?.applications
        },
        sessions: sessionsWithStats,
        total_sessions: sessionsWithStats.length,
        sessions_by_status: {
          active: sessionsWithStats.filter(s => s.status === "active").length,
          completed: sessionsWithStats.filter(s => s.status === "completed").length
        },
        total_duration_ms: sessionsWithStats.reduce((sum, s) => sum + (s.stats.duration_ms || 0), 0),
        total_checkpoints: sessionsWithStats.reduce((sum, s) => sum + s.stats.checkpoints.total, 0),
        total_file_changes: sessionsWithStats.reduce((sum, s) => sum + s.stats.file_changes.total, 0),
        total_decisions: sessionsWithStats.reduce((sum, s) => sum + s.stats.decisions.total, 0),
        total_snapshots: sessionsWithStats.reduce((sum, s) => sum + s.stats.snapshots.total, 0),
        average_compliance_score: sessionsWithStats.length ?
          Math.round(sessionsWithStats.reduce((sum, s) => sum + s.compliance_score, 0) / sessionsWithStats.length) :
          null,
        retrieval_time: new Date().toISOString()
      },
      warnings,
      nextActions
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(
      false,
      "Failed to Retrieve Session History",
      `Error retrieving session history: ${errorMessage}`,
      undefined,
      ["An unexpected error occurred", "Session history could not be retrieved"],
      ["Check error logs for details", "Try again after resolving any issues"]
    );
  }
} 