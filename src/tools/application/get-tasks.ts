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
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, status, start_time, end_time")
        .eq("task_id", task.id);

      const sessionStats = {
        total: sessions?.length || 0,
        active: sessions?.filter(s => s.status === "active").length || 0,
        completed: sessions?.filter(s => s.status === "completed").length || 0,
        total_duration: sessions?.reduce((sum, s) => {
          if (s.start_time && s.end_time) {
            return sum + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime());
          }
          return sum;
        }, 0) || 0
      };

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

      return {
        ...task,
        priority: `${task.priority} (${priorityLabel})`,
        stats: {
          sessions: sessionStats,
          file_changes: fileChangeStats,
          last_activity: sessions?.length ? 
            new Date(Math.max(...sessions.map(s => new Date(s.start_time).getTime()))).toISOString() :
            task.created_at
        }
      };
    }));

    // Generate warnings based on task state
    const warnings = [];
    if (tasksWithStats.length === 0) {
      warnings.push("No tasks found - YOU MUST create tasks to track work items");
    } else {
      const inProgressNoSessions = tasksWithStats.filter(t => 
        t.status === "in_progress" && t.stats.sessions.total === 0);
      if (inProgressNoSessions.length > 0) {
        warnings.push(`${inProgressNoSessions.length} in-progress tasks have no sessions recorded`);
      }

      const staleTasks = tasksWithStats.filter(t => 
        t.status !== "completed" && 
        new Date(t.stats.last_activity) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
      if (staleTasks.length > 0) {
        warnings.push(`${staleTasks.length} active tasks are stale (no activity in >3 days)`);
      }

      const incompleteCritical = tasksWithStats.filter(t => 
        t.status !== "completed" && t.priority.startsWith("1"));
      if (incompleteCritical.length > 0) {
        warnings.push(`${incompleteCritical.length} critical priority tasks are not completed`);
      }
    }

    // Generate next actions based on state
    const nextActions = [];
    if (tasksWithStats.length === 0) {
      nextActions.push("Create your first task using MUST-CREATE-TASK-PROPERLY");
      nextActions.push("Define clear acceptance criteria for the task");
    } else {
      nextActions.push("Review task details and select one to work on");
      nextActions.push("Initialize a session for your chosen task using MUST-INITIALIZE-SESSION");
      
      const readyTasks = tasksWithStats.filter(t => t.status === "ready");
      if (readyTasks.length > 0) {
        nextActions.push(`Begin work on ${readyTasks.length} ready tasks`);
      }

      const reviewTasks = tasksWithStats.filter(t => t.status === "review");
      if (reviewTasks.length > 0) {
        nextActions.push(`Review ${reviewTasks.length} tasks awaiting review`);
      }

      if (tasksWithStats.some(t => !t.acceptance_criteria)) {
        nextActions.push("Add acceptance criteria to tasks that are missing them");
      }
    }

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
          review: tasksWithStats.filter(t => t.status === "review").length,
          completed: tasksWithStats.filter(t => t.status === "completed").length
        },
        total_sessions: tasksWithStats.reduce((sum, t) => sum + t.stats.sessions.total, 0),
        total_file_changes: tasksWithStats.reduce((sum, t) => sum + t.stats.file_changes.total, 0),
        retrieval_time: new Date().toISOString()
      },
      warnings,
      nextActions
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