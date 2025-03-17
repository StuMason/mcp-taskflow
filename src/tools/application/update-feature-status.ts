import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST UPDATE FEATURE STATUS - FEATURE STATUS UPDATES ARE CRITICAL FOR PROPER WORKFLOW TRACKING - FAILURE TO UPDATE FEATURE STATUS WILL RESULT IN UNTRACEABLE PROGRESS AND IMPLEMENTATION CONFUSION";

// Tool schema
export const schema = schemas.application.updateFeatureStatus;

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Check if feature exists
    const { data: feature, error: featureError } = await supabase
      .from("features")
      .select("id, status, name, description, application_id, blocked_by_id, blocking_reason")
      .eq("id", params.featureId)
      .maybeSingle();

    if (featureError) {
      return createResponse(
        false, 
        "Feature Status Update Failed", 
        `Error checking feature existence: ${featureError.message}`,
        undefined,
        ["Database operation failed", "Feature may not exist or database is unavailable"],
        ["Verify the feature ID is correct", "Check database connection and try again"]
      );
    }

    if (!feature) {
      return createResponse(
        false, 
        "Feature Status Update Failed", 
        `Feature with ID ${params.featureId} does not exist`,
        undefined,
        ["The specified feature ID was not found in the database"],
        ["Verify the feature ID is correct", "Run MUST-GET-FEATURES to see available features"]
      );
    }

    // Get application info for context
    let applicationName = "Unknown";
    if (feature.application_id) {
      const { data: appData } = await supabase
        .from("applications")
        .select("name")
        .eq("id", feature.application_id)
        .single();
      
      if (appData) {
        applicationName = appData.name;
      }
    }

    // Validate blocking status requirements
    if (params.status === "blocked") {
      if (!params.blockingReason || !params.blockedById) {
        return createResponse(
          false,
          "Feature Status Update Failed",
          "Blocking reason and blocked by ID are required when setting status to 'blocked'",
          {
            feature_id: feature.id,
            feature_name: feature.name,
            application: applicationName,
            attempted_status: params.status
          },
          ["Missing required blocking information"],
          ["Provide both blockingReason and blockedById parameters", "Or choose a different status"]
        );
      }

      // Check if blocked_by feature exists
      const { data: blockingFeature } = await supabase
        .from("features")
        .select("id, name")
        .eq("id", params.blockedById)
        .single();

      if (!blockingFeature) {
        return createResponse(
          false,
          "Feature Status Update Failed",
          `Blocking feature with ID ${params.blockedById} does not exist`,
          undefined,
          ["The specified blocking feature was not found"],
          ["Verify the blocking feature ID is correct", "Run MUST-GET-FEATURES to see available features"]
        );
      }
    }

    // If status is already set to the requested value and blocking info hasn't changed
    if (feature.status === params.status &&
        feature.blocked_by_id === params.blockedById &&
        feature.blocking_reason === params.blockingReason) {
      return createResponse(
        true, 
        "Feature Status Already Current", 
        `Feature status is already set to '${params.status}'`,
        {
          feature_id: feature.id,
          feature_name: feature.name,
          application: applicationName,
          current_status: feature.status,
          requested_status: params.status,
          blocking_info: params.status === "blocked" ? {
            reason: feature.blocking_reason,
            blocked_by_id: feature.blocked_by_id
          } : null,
          timestamp: new Date().toISOString()
        },
        ["No status change was needed"],
        ["Continue with your workflow using the current status"]
      );
    }

    // Update the feature status
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
      .from("features")
      .update(updateData)
      .eq("id", params.featureId)
      .select()
      .single();

    if (error) {
      return createResponse(
        false, 
        "Feature Status Update Failed", 
        `Error updating feature status: ${error.message}`,
        {
          feature_id: feature.id,
          feature_name: feature.name,
          application: applicationName,
          attempted_status_change: `${feature.status} → ${params.status}`,
          timestamp: new Date().toISOString()
        },
        ["Database update operation failed", "Status remains unchanged"],
        ["Review the error message for details", "Attempt the update again after fixing any issues"]
      );
    }

    // Get counts of tasks in different statuses for this feature
    const { data: taskStats } = await supabase
      .from("tasks")
      .select("status")
      .eq("feature_id", params.featureId);
    
    const taskCounts = {
      total: taskStats?.length || 0,
      completed: taskStats?.filter(t => t.status === "completed").length || 0,
      in_progress: taskStats?.filter(t => t.status === "in_progress").length || 0,
      ready: taskStats?.filter(t => t.status === "ready").length || 0,
      backlog: taskStats?.filter(t => t.status === "backlog").length || 0,
      blocked: taskStats?.filter(t => t.status === "blocked").length || 0,
      on_hold: taskStats?.filter(t => t.status === "on_hold").length || 0,
      in_review: taskStats?.filter(t => t.status === "in_review").length || 0,
      needs_revision: taskStats?.filter(t => t.status === "needs_revision").length || 0,
      wont_do: taskStats?.filter(t => t.status === "wont_do").length || 0,
      abandoned: taskStats?.filter(t => t.status === "abandoned").length || 0,
      archived: taskStats?.filter(t => t.status === "archived").length || 0
    };

    // Prepare guidance based on new status
    let nextActions: string[] = [];
    let warnings: string[] = [];
    
    if (params.status === "planned") {
      nextActions = [
        "Develop a detailed implementation plan for this feature",
        "Break down the feature into specific tasks using MUST-CREATE-TASK-PROPERLY",
        "Set the feature to 'ready' when planning is complete"
      ];
    } else if (params.status === "backlog") {
      nextActions = [
        "Review and refine the feature requirements",
        "Set priority appropriately",
        "Move to 'ready' status when the feature is fully defined"
      ];
    } else if (params.status === "ready") {
      nextActions = [
        "Begin implementation by updating status to 'in_progress'",
        "Review all tasks and their priorities",
        "Ensure infrastructure is ready for development"
      ];
    } else if (params.status === "in_progress") {
      nextActions = [
        "Update task statuses as you progress through implementation",
        "Create regular progress checkpoints with MANDATORY-PROGRESS-CHECKPOINT",
        "Move tasks to 'in_review' as they are completed"
      ];
      if (taskCounts.total === 0) {
        warnings.push("No tasks have been created for this feature. Consider breaking down the work into specific tasks.");
      }
    } else if (params.status === "blocked") {
      nextActions = [
        `Monitor the blocking feature (ID: ${params.blockedById})`,
        "Update tasks to reflect blocked status if necessary",
        "Document any workarounds or alternative approaches"
      ];
      if (taskCounts.in_progress > 0) {
        warnings.push(`${taskCounts.in_progress} tasks are still marked as in_progress while feature is blocked`);
      }
    } else if (params.status === "on_hold") {
      nextActions = [
        "Document the reason for putting the feature on hold",
        "Set expectations for when work might resume",
        "Consider updating task statuses to reflect on-hold state"
      ];
    } else if (params.status === "in_review") {
      nextActions = [
        "Review all completed tasks",
        "Verify all acceptance criteria are met",
        "Move to 'completed' status once review is successful"
      ];
      if (taskCounts.completed < taskCounts.total) {
        warnings.push(`Only ${taskCounts.completed} of ${taskCounts.total} tasks are marked as completed`);
      }
    } else if (params.status === "completed") {
      nextActions = [
        "Document completion details and link to relevant artifacts",
        "Consider creating a new feature for follow-up work if needed",
        "Archive the feature if no further work is planned"
      ];
      if (taskCounts.completed < taskCounts.total) {
        warnings.push(`Only ${taskCounts.completed} of ${taskCounts.total} tasks are marked as completed`);
      }
    } else if (params.status === "wont_do") {
      nextActions = [
        "Document the reasons for not implementing this feature",
        "Update related features or tasks that might be affected",
        "Consider creating a decision log with MUST-LOG-ALL-DECISIONS"
      ];
    } else if (params.status === "abandoned") {
      nextActions = [
        "Document the reasons for abandoning this feature",
        "Update any related tasks to reflect this decision",
        "Consider creating a decision log with MUST-LOG-ALL-DECISIONS"
      ];
    } else if (params.status === "archived") {
      nextActions = [
        "Verify all documentation is complete and up-to-date",
        "Ensure all related tasks are also archived",
        "Consider if any knowledge should be preserved for future reference"
      ];
    }

    // Calculate task completion percentage
    const completionPercentage = taskCounts.total > 0 
      ? Math.round((taskCounts.completed / taskCounts.total) * 100) 
      : 0;

    return createResponse(
      true, 
      "Feature Status Updated", 
      `Successfully updated feature status from '${feature.status}' to '${params.status}'`,
      {
        feature_id: feature.id,
        feature_name: feature.name,
        application: applicationName,
        previous_status: feature.status,
        new_status: params.status,
        blocking_info: params.status === "blocked" ? {
          reason: params.blockingReason,
          blocked_by_id: params.blockedById
        } : null,
        task_stats: taskCounts,
        completion_percentage: `${completionPercentage}%`,
        update_time: new Date().toISOString()
      },
      warnings,
      nextActions
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(
      false, 
      "Feature Status Update Failed", 
      `Failed to update feature status: ${errorMessage}`,
      undefined,
      ["An unexpected error occurred", "Status update operation was not completed"],
      ["Check server logs for detailed error information", "Try again with valid parameters"]
    );
  }
}; 