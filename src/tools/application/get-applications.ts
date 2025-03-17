import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST GET A COMPLETE LIST OF ALL APPLICATIONS BEFORE PROCEEDING - THIS CRITICAL CONTEXT IS REQUIRED FOR PROPER WORKFLOW NAVIGATION AND TASK MANAGEMENT";

// Tool schema
export const schema = z.object(schemas.application.getApplications);

// Tool handler
export async function handler(): Promise<McpResponse> {
  try {
    // Query all applications with their feature counts
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        features:features(count)
      `);

    if (error) {
      return createResponse(
        false,
        "Failed to Retrieve Applications",
        `Error retrieving applications: ${error.message}`,
        undefined,
        ["Database operation failed", "Application list could not be retrieved"],
        ["Check database connection", "Try again in a few moments"]
      );
    }

    // Calculate statistics for each application
    const appsWithStats = await Promise.all(data.map(async (app) => {
      // Get feature stats with their tasks
      const { data: features } = await supabase
        .from("features")
        .select(`
          id, 
          status,
          tasks (
            id,
            status
          )
        `)
        .eq("application_id", app.id);

      const featureStats = {
        total: features?.length || 0,
        planned: features?.filter(f => f.status === "planned").length || 0,
        in_progress: features?.filter(f => f.status === "in_progress").length || 0,
        completed: features?.filter(f => f.status === "completed").length || 0,
        abandoned: features?.filter(f => f.status === "abandoned").length || 0
      };

      // Calculate task stats across all features
      const tasks = features?.flatMap(f => f.tasks) || [];
      const taskStats = {
        total: tasks.length,
        backlog: tasks.filter(t => t.status === "backlog").length,
        ready: tasks.filter(t => t.status === "ready").length,
        in_progress: tasks.filter(t => t.status === "in_progress").length,
        in_review: tasks.filter(t => t.status === "in_review").length,
        completed: tasks.filter(t => t.status === "completed").length
      };

      return {
        ...app,
        stats: {
          features: featureStats,
          tasks: taskStats,
          completion_percentage: featureStats.total > 0 
            ? Math.round((featureStats.completed / featureStats.total) * 100) 
            : 0
        }
      };
    }));

    // Generate warnings based on application state
    const warnings = [];
    if (appsWithStats.length === 0) {
      warnings.push("No applications found - YOU MUST create an application first");
    } else {
      const incompleteApps = appsWithStats.filter(app => app.stats.completion_percentage < 100);
      if (incompleteApps.length > 0) {
        warnings.push(`${incompleteApps.length} applications have incomplete features`);
      }
    }

    // Generate next actions based on state
    const nextActions = [];
    if (appsWithStats.length === 0) {
      nextActions.push("Create your first application using MUST-CREATE-APPLICATION-FIRST");
    } else {
      nextActions.push("Review application details and select one to work on");
      nextActions.push("Get features for your chosen application using MUST-GET-FEATURES");
      if (appsWithStats.some(app => !app.description)) {
        nextActions.push("Add descriptions to applications that are missing them");
      }
    }

    return createResponse(
      true,
      "Applications Retrieved",
      `Successfully retrieved ${data.length} applications`,
      {
        applications: appsWithStats,
        total_applications: appsWithStats.length,
        retrieval_time: new Date().toISOString()
      },
      warnings,
      nextActions
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(
      false,
      "Failed to Retrieve Applications",
      `Error retrieving applications: ${errorMessage}`,
      undefined,
      ["An unexpected error occurred", "Application list could not be retrieved"],
      ["Check error logs for details", "Try again after resolving any issues"]
    );
  }
} 