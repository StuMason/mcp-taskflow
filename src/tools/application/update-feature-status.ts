import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST UPDATE FEATURE STATUS - FEATURE STATUS UPDATES ARE CRITICAL FOR PROPER WORKFLOW TRACKING - FAILURE TO UPDATE FEATURE STATUS WILL RESULT IN UNTRACEABLE PROGRESS AND IMPLEMENTATION CONFUSION";

// Tool schema
export const schema = z.object({
  featureId: z.string().describe("ID of the feature to update"),
  status: z.enum(["planned", "in_progress", "completed", "abandoned"])
    .describe("New status for the feature")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Check if feature exists
    const { data: feature, error: featureError } = await supabase
      .from("features")
      .select("id, status, name, description, application_id")
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

    // If status is already set to the requested value, return early
    if (feature.status === params.status) {
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
          timestamp: new Date().toISOString()
        },
        ["No status change was needed"],
        ["Continue with your workflow using the current status"]
      );
    }

    // Update the feature status
    const { data, error } = await supabase
      .from("features")
      .update({ status: params.status, updated_at: new Date().toISOString() })
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
      review: taskStats?.filter(t => t.status === "review").length || 0
    };

    // Prepare guidance based on new status
    let nextActions: string[] = [];
    
    if (params.status === "planned") {
      nextActions = [
        "Develop a detailed implementation plan for this feature",
        "Break down the feature into specific tasks using MUST-CREATE-TASK-PROPERLY",
        "Set the feature to 'in_progress' when you begin active development"
      ];
    } else if (params.status === "in_progress") {
      nextActions = [
        "Update task statuses as you progress through implementation",
        "Create regular progress checkpoints with MANDATORY-PROGRESS-CHECKPOINT",
        "Mark the feature as 'completed' when all tasks are done"
      ];
    } else if (params.status === "completed") {
      nextActions = [
        "Ensure all tasks for this feature are marked as completed",
        "Document completion details and link to relevant artifacts",
        "Consider creating a new feature for follow-up work if needed"
      ];
    } else if (params.status === "abandoned") {
      nextActions = [
        "Document the reasons for abandoning this feature",
        "Update any related tasks to reflect this decision",
        "Consider creating a decision log with MUST-LOG-ALL-DECISIONS to record the rationale"
      ];
    }

    // Calculate task completion percentage
    const completionPercentage = taskCounts.total > 0 
      ? Math.round((taskCounts.completed / taskCounts.total) * 100) 
      : 0;
    
    // Determine if task distribution is potentially problematic
    const warnings = [];
    if (params.status === "completed" && completionPercentage < 100) {
      warnings.push(`Only ${completionPercentage}% of tasks are marked as completed. Verify all tasks are properly updated.`);
    }
    
    if (params.status === "in_progress" && taskCounts.total === 0) {
      warnings.push("No tasks have been created for this feature. Consider breaking down the work into specific tasks.");
    }

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