import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST GET ALL FEATURES FOR AN APPLICATION - FAILURE TO RETRIEVE THE COMPLETE FEATURE SET WILL RESULT IN INCOMPLETE CONTEXT AND FAULTY PLANNING";

// Tool schema
export const schema = z.object(schemas.application.getFeatures);

// Tool handler
export async function handler(params: z.infer<typeof schema>): Promise<McpResponse> {
  try {
    // Validate the application exists
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, name, description")
      .eq("id", params.applicationId)
      .maybeSingle();

    if (appError) {
      return createResponse(
        false,
        "Failed to Retrieve Features",
        `Error checking application existence: ${appError.message}`,
        undefined,
        ["Database operation failed", "Application may not exist"],
        ["Verify the application ID is correct", "Use MUST-GET-APPLICATIONS to list available applications"]
      );
    }

    if (!application) {
      return createResponse(
        false,
        "Failed to Retrieve Features",
        `Application with ID ${params.applicationId} does not exist`,
        undefined,
        ["The specified application ID was not found", "Features must be retrieved from an existing application"],
        ["Use MUST-GET-APPLICATIONS to list available applications", "Create the application first using MUST-CREATE-APPLICATION-FIRST"]
      );
    }

    // Query the features with task counts
    const { data, error } = await supabase
      .from("features")
      .select(`
        *,
        tasks:tasks(count)
      `)
      .eq("application_id", params.applicationId)
      .order("created_at", { ascending: false });

    if (error) {
      return createResponse(
        false,
        "Failed to Retrieve Features",
        `Error retrieving features: ${error.message}`,
        undefined,
        ["Database operation failed", "Feature list could not be retrieved"],
        ["Check database connection", "Try again in a few moments"]
      );
    }

    // Calculate statistics for each feature
    const featuresWithStats = await Promise.all(data.map(async (feature) => {
      // Get task stats
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, status, priority")
        .eq("feature_id", feature.id);

      const taskStats = {
        total: tasks?.length || 0,
        backlog: tasks?.filter(t => t.status === "backlog").length || 0,
        ready: tasks?.filter(t => t.status === "ready").length || 0,
        in_progress: tasks?.filter(t => t.status === "in_progress").length || 0,
        review: tasks?.filter(t => t.status === "review").length || 0,
        completed: tasks?.filter(t => t.status === "completed").length || 0,
        by_priority: {
          critical: tasks?.filter(t => t.priority === 1).length || 0,
          high: tasks?.filter(t => t.priority === 2).length || 0,
          medium: tasks?.filter(t => t.priority === 3).length || 0,
          low: tasks?.filter(t => t.priority === 4).length || 0,
          lowest: tasks?.filter(t => t.priority === 5).length || 0
        }
      };

      return {
        ...feature,
        stats: {
          tasks: taskStats,
          completion_percentage: taskStats.total > 0 
            ? Math.round((taskStats.completed / taskStats.total) * 100) 
            : 0
        }
      };
    }));

    // Generate warnings based on feature state
    const warnings = [];
    if (featuresWithStats.length === 0) {
      warnings.push("No features found - YOU MUST create features to organize your work");
    } else {
      const incompleteFeatures = featuresWithStats.filter(f => 
        f.status === "in_progress" && f.stats.completion_percentage < 100);
      if (incompleteFeatures.length > 0) {
        warnings.push(`${incompleteFeatures.length} in-progress features have incomplete tasks`);
      }

      const staleFeatures = featuresWithStats.filter(f => 
        f.status === "planned" && new Date(f.created_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      if (staleFeatures.length > 0) {
        warnings.push(`${staleFeatures.length} planned features are stale (>7 days old)`);
      }
    }

    // Generate next actions based on state
    const nextActions = [];
    if (featuresWithStats.length === 0) {
      nextActions.push("Create your first feature using MUST-CREATE-FEATURE-PROPERLY");
      nextActions.push("Plan your feature implementation approach");
    } else {
      nextActions.push("Review feature details and select one to work on");
      nextActions.push("Get tasks for your chosen feature using MUST-GET-TASKS");
      
      const inProgressFeatures = featuresWithStats.filter(f => f.status === "in_progress");
      if (inProgressFeatures.length > 0) {
        nextActions.push("Continue work on in-progress features before starting new ones");
      }

      if (featuresWithStats.some(f => !f.description)) {
        nextActions.push("Add descriptions to features that are missing them");
      }
    }

    return createResponse(
      true,
      "Features Retrieved",
      `Successfully retrieved ${data.length} features for application '${application.name}'`,
      {
        application: {
          id: application.id,
          name: application.name,
          description: application.description
        },
        features: featuresWithStats,
        total_features: featuresWithStats.length,
        features_by_status: {
          planned: featuresWithStats.filter(f => f.status === "planned").length,
          in_progress: featuresWithStats.filter(f => f.status === "in_progress").length,
          completed: featuresWithStats.filter(f => f.status === "completed").length,
          abandoned: featuresWithStats.filter(f => f.status === "abandoned").length
        },
        total_tasks: featuresWithStats.reduce((sum, f) => sum + f.stats.tasks.total, 0),
        completed_tasks: featuresWithStats.reduce((sum, f) => sum + f.stats.tasks.completed, 0),
        retrieval_time: new Date().toISOString()
      },
      warnings,
      nextActions
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(
      false,
      "Failed to Retrieve Features",
      `Error retrieving features: ${errorMessage}`,
      undefined,
      ["An unexpected error occurred", "Feature list could not be retrieved"],
      ["Check error logs for details", "Try again after resolving any issues"]
    );
  }
} 