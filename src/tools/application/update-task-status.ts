import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST UPDATE TASK STATUS - TASK STATUS UPDATES ARE ESSENTIAL FOR IMPLEMENTATION SEQUENCING AND WORKFLOW COMPLIANCE - FAILURE TO UPDATE TASK STATUS WILL LEAD TO SCATTERED DEVELOPMENT AND INCOMPLETE FEATURES";

// Tool schema
export const schema = schemas.application.updateTaskStatus;

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Check if task exists
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status, name, description, feature_id, priority, acceptance_criteria, blocked_by_id, blocking_reason")
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

    // Validate blocking status requirements
    if (params.status === "blocked") {
      if (!params.blockingReason || !params.blockedById) {
        return createResponse(
          false,
          "Task Status Update Failed",
          "Blocking reason and blocked by ID are required when setting status to 'blocked'",
          {
            task_id: task.id,
            task_name: task.name,
            feature: featureName,
            application: applicationName,
            attempted_status: params.status
          },
          ["Missing required blocking information"],
          ["Provide both blockingReason and blockedById parameters", "Or choose a different status"]
        );
      }

      // Check if blocked_by task exists
      const { data: blockingTask } = await supabase
        .from("tasks")
        .select("id, name")
        .eq("id", params.blockedById)
        .single();

      if (!blockingTask) {
        return createResponse(
          false,
          "Task Status Update Failed",
          `Blocking task with ID ${params.blockedById} does not exist`,
          undefined,
          ["The specified blocking task was not found"],
          ["Verify the blocking task ID is correct", "Run MUST-GET-TASKS to see available tasks"]
        );
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

    // If status is already set to the requested value and blocking info hasn't changed
    if (task.status === params.status &&
        task.blocked_by_id === params.blockedById &&
        task.blocking_reason === params.blockingReason) {
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
          blocking_info: params.status === "blocked" ? {
            reason: task.blocking_reason,
            blocked_by_id: task.blocked_by_id
          } : null,
          timestamp: new Date().toISOString()
        },
        ["No status change was needed"],
        ["Continue with your workflow using the current status"]
      );
    }

    // Update the task status
    const updateData: any = {
      status: params.status,
      updated_at: new Date().toISOString()
    };

    // Handle blocking information
    if (params.status === "blocked") {
      updateData.blocking_reason = params.blockingReason;
      updateData.blocked_by_id = params.blockedById;
    } else {
      // Clear blocking info when not blocked
      updateData.blocking_reason = null;
      updateData.blocked_by_id = null;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
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

    // Prepare guidance based on new status
    let nextActions: string[] = [];
    let warnings: string[] = [];
    
    if (params.status === "backlog") {
      nextActions = [
        "Review and refine the task description and acceptance criteria",
        "Set the priority appropriately",
        "Move to 'ready' status when the task is fully defined"
      ];
    } else if (params.status === "ready") {
      nextActions = [
        "Begin implementation by updating status to 'in_progress'",
        "Review acceptance criteria before starting work",
        "Ensure you understand all requirements"
      ];
      if (!task.acceptance_criteria) {
        warnings.push("Task is marked as ready but has no acceptance criteria defined");
      }
    } else if (params.status === "blocked") {
      nextActions = [
        `Monitor the blocking task (ID: ${params.blockedById})`,
        "Document any workarounds being considered",
        "Consider if other tasks can be worked on in parallel"
      ];
    } else if (params.status === "on_hold") {
      nextActions = [
        "Document the reason for putting the task on hold",
        "Set expectations for when work might resume",
        "Consider impact on dependent tasks"
      ];
    } else if (params.status === "in_progress") {
      nextActions = [
        "Create regular progress checkpoints with MANDATORY-PROGRESS-CHECKPOINT",
        "Document significant decisions with MUST-LOG-ALL-DECISIONS",
        "Record all file changes with MUST-RECORD-EVERY-FILE-CHANGE",
        "Move to 'in_review' when implementation is complete"
      ];
      if (!task.acceptance_criteria) {
        warnings.push("Task is in progress but has no acceptance criteria defined");
      }
    } else if (params.status === "in_review") {
      nextActions = [
        "Verify all acceptance criteria have been met",
        "Create any necessary snapshots of the implementation",
        "Address any review feedback promptly"
      ];
    } else if (params.status === "needs_revision") {
      nextActions = [
        "Review feedback and understand required changes",
        "Update implementation to address concerns",
        "Move back to 'in_review' when changes are complete"
      ];
    } else if (params.status === "completed") {
      nextActions = [
        "Document completion details and summarize changes made",
        "Consider ending your session with MUST-END-SESSION-PROPERLY",
        "Update the parent feature status if this was the last task"
      ];
      if (task.acceptance_criteria && task.acceptance_criteria.trim().length > 0) {
        warnings.push("Verify that all acceptance criteria have been satisfied");
      }
    } else if (params.status === "wont_do") {
      nextActions = [
        "Document the reasons for not implementing this task",
        "Update related tasks that might be affected",
        "Consider creating a decision log with MUST-LOG-ALL-DECISIONS"
      ];
    } else if (params.status === "abandoned") {
      nextActions = [
        "Document the reasons for abandoning this task",
        "Update any dependent tasks",
        "Consider creating a decision log with MUST-LOG-ALL-DECISIONS"
      ];
    } else if (params.status === "archived") {
      nextActions = [
        "Verify all documentation is complete",
        "Ensure any knowledge gained is preserved",
        "Update related task references if needed"
      ];
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
        blocking_info: params.status === "blocked" ? {
          reason: params.blockingReason,
          blocked_by_id: params.blockedById
        } : null,
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