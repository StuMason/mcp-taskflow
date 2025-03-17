import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST CREATE FEATURES PROPERLY WITH COMPLETE INFORMATION - FEATURES ARE THE CRITICAL ORGANIZING STRUCTURE FOR TASKS AND IMPLEMENTATION WORK - INCOMPLETE FEATURE DEFINITIONS LEAD TO SCATTERED DEVELOPMENT";

// Tool schema
export const schema = z.object({
  applicationId: z.string().describe("ID of the parent application"),
  name: z.string().describe("Name of the feature"),
  description: z.string().optional().describe("Description of the feature"),
  status: z.enum(["planned", "in_progress", "completed", "abandoned"])
    .default("planned")
    .describe("Current status of the feature"),
  priority: z.number().default(1).describe("Priority of the feature (higher number = higher priority)")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Check if application exists and get its details
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, name, description")
      .eq("id", params.applicationId)
      .maybeSingle();

    if (appError) {
      return createResponse(false, 
        "Feature Creation Failed", 
        `Error checking application existence: ${appError.message}`,
        undefined,
        ["Database operation failed", "Application may not exist"],
        ["Verify the application ID is correct", "Use MUST-GET-APPLICATIONS to list available applications"]
      );
    }

    if (!application) {
      return createResponse(false, 
        "Feature Creation Failed", 
        `Application with ID ${params.applicationId} does not exist`,
        undefined,
        ["The specified application ID was not found", "Features must be created within an existing application"],
        ["Use MUST-GET-APPLICATIONS to list available applications", "Create the application first using MUST-CREATE-APPLICATION-FIRST"]
      );
    }

    // Check if feature already exists with this name for this application
    const { data: existingFeature, error: checkError } = await supabase
      .from("features")
      .select("id")
      .eq("application_id", params.applicationId)
      .eq("name", params.name)
      .maybeSingle();

    if (checkError) {
      return createResponse(false, 
        "Feature Creation Failed", 
        `Error checking feature existence: ${checkError.message}`,
        undefined,
        ["Database operation failed", "Feature state is unknown"],
        ["Verify database connection", "Check error logs for details"]
      );
    }

    if (existingFeature) {
      return createResponse(false, 
        "Feature Already Exists", 
        `Feature with name '${params.name}' already exists for this application`,
        { existing_feature_id: existingFeature.id },
        ["A feature with this name already exists in the application", "Duplicate features are not allowed"],
        ["Use MUST-GET-FEATURES to view existing features", "Choose a different name or work with the existing feature"]
      );
    }

    // Create the new feature
    const { data, error } = await supabase
      .from("features")
      .insert([
        {
          application_id: params.applicationId,
          name: params.name,
          description: params.description || null,
          status: params.status,
          priority: params.priority
        }
      ])
      .select()
      .single();

    if (error) {
      return createResponse(false, 
        "Feature Creation Failed", 
        `Error creating feature: ${error.message}`,
        undefined,
        ["Database insert operation failed", "Feature was not created"],
        ["Review the error message", "Verify all required fields are provided", "Try again with valid parameters"]
      );
    }

    // Get feature stats
    const { data: taskStats } = await supabase
      .from("tasks")
      .select("status")
      .eq("feature_id", data.id);

    const stats = {
      total_tasks: taskStats?.length || 0,
      tasks_by_status: {
        backlog: taskStats?.filter(t => t.status === "backlog").length || 0,
        ready: taskStats?.filter(t => t.status === "ready").length || 0,
        in_progress: taskStats?.filter(t => t.status === "in_progress").length || 0,
        review: taskStats?.filter(t => t.status === "review").length || 0,
        completed: taskStats?.filter(t => t.status === "completed").length || 0
      }
    };

    // Map priority to descriptive label
    const priorityLabels = {
      1: "Critical",
      2: "High",
      3: "Medium",
      4: "Low",
      5: "Lowest/Chore"
    };

    // Prepare next actions based on feature state
    const nextActions = [
      "Break down the feature into specific tasks using MUST-CREATE-TASK-PROPERLY",
      "Document the feature's implementation approach with MUST-LOG-ALL-DECISIONS",
      "Create a development timeline and task priorities",
      "Set up any necessary infrastructure or dependencies"
    ];

    // Add status-specific actions
    if (params.status === "planned") {
      nextActions.push("Develop a detailed implementation plan");
      nextActions.push("Update status to 'in_progress' when ready to begin work");
    } else if (params.status === "in_progress") {
      nextActions.push("Start creating and assigning tasks");
      nextActions.push("Set up progress tracking with MANDATORY-PROGRESS-CHECKPOINT");
    }

    // Add description-related action if missing
    if (!params.description) {
      nextActions.push("Add a detailed description of the feature's requirements and goals");
    }

    return createResponse(true, 
      "Feature Created", 
      `Feature '${params.name}' created successfully in application '${application.name}'`,
      {
        feature: {
          ...data,
          priority: `${data.priority} (${priorityLabels[data.priority as keyof typeof priorityLabels] || `Priority ${data.priority}`})`
        },
        application: {
          id: application.id,
          name: application.name,
          description: application.description
        },
        stats: stats,
        creation_time: new Date().toISOString()
      },
      [],
      nextActions
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Feature Creation Failed", 
      `Failed to create feature: ${errorMessage}`,
      undefined,
      ["An unexpected error occurred", "Feature creation was not completed"],
      ["Check server logs for detailed error information", "Try again with valid parameters"]
    );
  }
}; 