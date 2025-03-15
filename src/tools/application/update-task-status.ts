import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST UPDATE TASK STATUS - TASK STATUS UPDATES ARE ESSENTIAL FOR IMPLEMENTATION SEQUENCING AND WORKFLOW COMPLIANCE - FAILURE TO UPDATE TASK STATUS WILL LEAD TO SCATTERED DEVELOPMENT AND INCOMPLETE FEATURES";

// Tool schema
export const schema = z.object({
  taskId: z.string().describe("ID of the task to update"),
  status: z.enum(["backlog", "ready", "in_progress", "review", "completed"])
    .describe("New status for the task")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Check if task exists
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status, name, description, feature_id, priority, acceptance_criteria")
      .eq("id", params.taskId)
      .maybeSingle();

    if (taskError) {
      return createResponse(
        false, 
        "Task Status Update Failed", 
        `Error checking task existence: ${taskError.message}`,
        undefined,
        ["Database operation failed", "Task may not exist or database is unavailable"],
        ["Verify the task ID is correct", "Check database connection and try again"]
      );
    }

    if (!task) {
      return createResponse(
        false, 
        "Task Status Update Failed", 
        `Task with ID ${params.taskId} does not exist`,
        undefined,
        ["The specified task ID was not found in the database"],
        ["Verify the task ID is correct", "Run MUST-GET-TASKS to see available tasks"]
      );
    }

    // Get feature and application info for context
    let featureName = "Unknown";
    let applicationName = "Unknown";
    
    if (task.feature_id) {
      const { data: featureData } = await supabase
        .from("features")
        .select("name, application_id")
        .eq("id", task.feature_id)
        .single();
      
      if (featureData) {
        featureName = featureData.name;
        
        if (featureData.application_id) {
          const { data: appData } = await supabase
            .from("applications")
            .select("name")
            .eq("id", featureData.application_id)
            .single();
            
          if (appData) {
            applicationName = appData.name;
          }
        }
      }
    }

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

    // If status is already set to the requested value, return early
    if (task.status === params.status) {
      return createResponse(
        true, 
        "Task Status Already Current", 
        `Task status is already set to '${params.status}'`,
        {
          task_id: task.id,
          task_name: task.name,
          feature: featureName,
          application: applicationName,
          priority: `${task.priority} (${priorityLabel})`,
          current_status: task.status,
          requested_status: params.status,
          timestamp: new Date().toISOString()
        },
        ["No status change was needed"],
        ["Continue with your workflow using the current status"]
      );
    }

    // Update the task status
    const { data, error } = await supabase
      .from("tasks")
      .update({ status: params.status, updated_at: new Date().toISOString() })
      .eq("id", params.taskId)
      .select()
      .single();

    if (error) {
      return createResponse(
        false, 
        "Task Status Update Failed", 
        `Error updating task status: ${error.message}`,
        {
          task_id: task.id,
          task_name: task.name,
          feature: featureName,
          application: applicationName,
          attempted_status_change: `${task.status} → ${params.status}`,
          timestamp: new Date().toISOString()
        },
        ["Database update operation failed", "Status remains unchanged"],
        ["Review the error message for details", "Attempt the update again after fixing any issues"]
      );
    }

    // Prepare guidance based on new status
    let nextActions: string[] = [];
    let warnings: string[] = [];
    
    if (params.status === "backlog") {
      nextActions = [
        "Review and refine the task description and acceptance criteria",
        "Set the priority appropriately",
        "Move to 'ready' status when the task is fully defined and ready to be worked on"
      ];
    } else if (params.status === "ready") {
      nextActions = [
        "Begin implementation by updating status to 'in_progress'",
        "Review acceptance criteria before starting work",
        "Ensure you understand all requirements"
      ];
    } else if (params.status === "in_progress") {
      nextActions = [
        "Create regular progress checkpoints with MANDATORY-PROGRESS-CHECKPOINT",
        "Document significant decisions with MUST-LOG-ALL-DECISIONS",
        "Record all file changes with MUST-RECORD-EVERY-FILE-CHANGE",
        "Move to 'review' status when implementation is complete"
      ];
    } else if (params.status === "review") {
      nextActions = [
        "Verify all acceptance criteria have been met",
        "Create any necessary snapshots of the final implementation",
        "Move to 'completed' status once all requirements are satisfied"
      ];
    } else if (params.status === "completed") {
      nextActions = [
        "Document completion details and summarize changes made",
        "Consider ending your session with MUST-END-SESSION-PROPERLY",
        "Update the parent feature status if this was the last task"
      ];
      
      // Check if the task meets its acceptance criteria
      if (task.acceptance_criteria && task.acceptance_criteria.trim().length > 0) {
        warnings.push("Verify that all acceptance criteria have been satisfied before proceeding");
      }
    }

    // Get other tasks in the same feature to show progress context
    let featureProgress = {};
    
    if (task.feature_id) {
      const { data: featureTasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("feature_id", task.feature_id);
        
      if (featureTasks) {
        const totalTasks = featureTasks.length;
        const completedTasks = featureTasks.filter(t => t.status === "completed").length;
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        featureProgress = {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          completion_percentage: `${completionPercentage}%`
        };
        
        // If this was the last task to be completed, suggest updating the feature status
        if (params.status === "completed" && completedTasks === totalTasks) {
          nextActions.push("This was the last task - update the feature status to 'completed' with MUST-UPDATE-FEATURE-STATUS");
        }
      }
    }

    return createResponse(
      true, 
      "Task Status Updated", 
      `Successfully updated task status from '${task.status}' to '${params.status}'`,
      {
        task_id: task.id,
        task_name: task.name,
        feature_id: task.feature_id,
        feature_name: featureName,
        application: applicationName,
        priority: `${task.priority} (${priorityLabel})`,
        previous_status: task.status,
        new_status: params.status,
        feature_progress: featureProgress,
        update_time: new Date().toISOString()
      },
      warnings,
      nextActions
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(
      false, 
      "Task Status Update Failed", 
      `Failed to update task status: ${errorMessage}`,
      undefined,
      ["An unexpected error occurred", "Status update operation was not completed"],
      ["Check server logs for detailed error information", "Try again with valid parameters"]
    );
  }
}; 