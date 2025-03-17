import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST GET ALL TASKS FOR A FEATURE - COMPREHENSIVE TASK AWARENESS IS ESSENTIAL FOR PROPER IMPLEMENTATION SEQUENCING AND WORKFLOW COMPLIANCE";

// Tool schema
export const schema = z.object(schemas.application.getTasks);

// Tool handler
export async function handler(params: z.infer<typeof schema>): Promise<McpResponse> {
  try {
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

    // Query the tasks with their session counts
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        sessions:sessions(count)
      `)
      .eq("feature_id", params.featureId)
      .order("created_at", { ascending: false });

    if (error) {
      return createResponse(
        false,
        "Failed to Retrieve Tasks",
        `Error retrieving tasks: ${error.message}`,
        undefined,
        ["Database operation failed", "Task list could not be retrieved"],
        ["Check database connection", "Try again in a few moments"]
      );
    }

    // Calculate statistics for each task
    const tasksWithStats = await Promise.all(data.map(async (task) => {
      // Get session stats
      const sessions = await supabase
        .from('sessions')
        .select('*')
        .eq('task_id', task.id);

      if (sessions.error) {
        console.warn('Failed to get sessions:', sessions.error);
        return {
          ...task,
          sessions: {
            total: 0,
            active: 0,
            completed: 0,
            total_duration_ms: 0,
            total_duration: "0s"
          },
          last_active: null,
          next_actions: []
        };
      }

      const sessionStats = {
        total: sessions.data.length,
        active: sessions.data?.filter(s => s.timestamp === null).length || 0,
        completed: sessions.data?.filter(s => s.timestamp !== null).length || 0,
        total_duration_ms: sessions.data?.reduce((sum, s) => {
          if (s.timestamp) {
            return sum + (new Date().getTime() - new Date(s.timestamp).getTime());
          }
          return sum;
        }, 0) || 0
      };

      const lastSession = sessions.data?.[sessions.data.length - 1];
      const lastActive = lastSession && !lastSession.timestamp;

      // Get file change stats
      const { data: fileChanges } = await supabase
        .from("file_changes")
        .select("id, change_type")
        .eq("task_id", task.id);

      const fileChangeStats = {
        total: fileChanges?.length || 0,
        created: fileChanges?.filter(f => f.change_type === "created").length || 0,
        modified: fileChanges?.filter(f => f.change_type === "modified").length || 0,
        deleted: fileChanges?.filter(f => f.change_type === "deleted").length || 0
      };

      // Map priority to descriptive label
      const priorityLabels = {
        1: "Critical",
        2: "High",
        3: "Medium",
        4: "Low",
        5: "Lowest/Chore"
      };

      const priorityLabel = task.priority ? 
        priorityLabels[task.priority as keyof typeof priorityLabels] || `Priority ${task.priority}` : 
        "Unknown Priority";

      // Get task stats
      const taskStats = {
        total: data.length,
        backlog: data.filter(t => t.status === "backlog").length,
        ready: data.filter(t => t.status === "ready").length,
        in_progress: data.filter(t => t.status === "in_progress").length,
        in_review: data.filter(t => t.status === "in_review").length,
        completed: data.filter(t => t.status === "completed").length
      };

      // Generate warnings based on task state
      const warnings = [];
      if (taskStats.total === 0) {
        warnings.push("No tasks found - YOU MUST create tasks to track work items");
      } else {
        if (taskStats.in_progress === 0) {
          warnings.push("No in-progress tasks found");
        }

        if (lastActive) {
          warnings.push("The last session for this task is incomplete");
        }
      }

      // Generate next actions based on state
      const nextActions = [];
      if (taskStats.total === 0) {
        nextActions.push("Create your first task using MUST-CREATE-TASK-PROPERLY");
        nextActions.push("Define clear acceptance criteria for the task");
      } else {
        nextActions.push("Review task details and select one to work on");
        nextActions.push("Initialize a session for your chosen task using MUST-INITIALIZE-SESSION");
        
        const readyTasks = data.filter(t => t.status === "ready");
        if (readyTasks.length > 0) {
          nextActions.push(`Begin work on ${readyTasks.length} ready tasks`);
        }

        const inReviewTasks = data.filter(t => t.status === "in_review");
        if (inReviewTasks.length > 0) {
          nextActions.push(`Review ${inReviewTasks.length} tasks awaiting review`);
        }

        if (data.some(t => !t.acceptance_criteria)) {
          nextActions.push("Add acceptance criteria to tasks that are missing them");
        }

        if (lastActive) {
          nextActions.push("Complete the active session");
        }

        if (sessionStats.total === 0) {
          nextActions.push("Start your first session");
        }
      }

      return {
        ...task,
        priority: `${task.priority} (${priorityLabel})`,
        sessions: sessionStats,
        total_sessions: sessionStats.total,
        total_file_changes: fileChangeStats.total,
        retrieval_time: new Date().toISOString(),
        last_active: lastSession ? 
          new Date(Math.max(...sessions.data.map(s => new Date(s.timestamp || new Date()).getTime()))).toISOString() :
          null,
        next_actions: nextActions
      };
    }));

    return createResponse(
      true,
      "Tasks Retrieved",
      `Successfully retrieved ${data.length} tasks for feature '${feature.name}'`,
      {
        feature: {
          id: feature.id,
          name: feature.name,
          description: feature.description,
          status: feature.status,
          application: feature.applications
        },
        tasks: tasksWithStats,
        total_tasks: tasksWithStats.length,
        tasks_by_status: {
          backlog: tasksWithStats.filter(t => t.status === "backlog").length,
          ready: tasksWithStats.filter(t => t.status === "ready").length,
          in_progress: tasksWithStats.filter(t => t.status === "in_progress").length,
          in_review: tasksWithStats.filter(t => t.status === "in_review").length,
          completed: tasksWithStats.filter(t => t.status === "completed").length
        },
        total_sessions: tasksWithStats.reduce((sum, t) => sum + t.sessions.total, 0),
        total_file_changes: tasksWithStats.reduce((sum, t) => sum + t.total_file_changes, 0),
        retrieval_time: new Date().toISOString()
      },
      warnings,
      tasksWithStats.map(t => t.next_actions).flat()
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(
      false,
      "Failed to Retrieve Tasks",
      `Error retrieving tasks: ${errorMessage}`,
      undefined,
      ["An unexpected error occurred", "Task list could not be retrieved"],
      ["Check error logs for details", "Try again after resolving any issues"]
    );
  }
} 