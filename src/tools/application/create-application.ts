import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST CREATE AN APPLICATION FIRST - ALL TASKS AND FEATURES MUST BE ORGANIZED WITHIN AN APPLICATION CONTEXT - FAILURE TO CREATE THE APPLICATION PROPERLY WILL BREAK THE ENTIRE TASK HIERARCHY";

// Tool schema
export const schema = z.object({
  name: z.string().describe("Name of the application"),
  description: z.string().optional().describe("Description of the application"),
  repositoryUrl: z.string().optional().describe("URL to the application's repository")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Check if application already exists with this name
    const { data: existingApp, error: checkError } = await supabase
      .from("applications")
      .select("id")
      .eq("name", params.name)
      .maybeSingle();

    if (checkError) {
      return createResponse(false, 
        "Application Creation Failed", 
        `Error checking application existence: ${checkError.message}`,
        undefined,
        ["Database operation failed", "Application state is unknown"],
        ["Verify database connection", "Check error logs for details"]
      );
    }

    if (existingApp) {
      return createResponse(false, 
        "Application Already Exists", 
        `Application with name '${params.name}' already exists`,
        { existing_application_id: existingApp.id },
        ["An application with this name already exists", "Duplicate applications are not allowed"],
        ["Use MUST-GET-APPLICATIONS to view existing applications", "Choose a different name or work with the existing application"]
      );
    }

    // Create the new application
    const { data, error } = await supabase
      .from("applications")
      .insert([
        {
          name: params.name,
          description: params.description || null,
          repository_url: params.repositoryUrl || null
        }
      ])
      .select()
      .single();

    if (error) {
      return createResponse(false, 
        "Application Creation Failed", 
        `Error creating application: ${error.message}`,
        undefined,
        ["Database insert operation failed", "Application was not created"],
        ["Review the error message", "Verify all required fields are provided", "Try again with valid parameters"]
      );
    }

    // Get application stats
    const { data: featureCount } = await supabase
      .from("features")
      .select("id")
      .eq("application_id", data.id);

    const { data: taskCount } = await supabase
      .from("tasks")
      .select("id, status")
      .eq("application_id", data.id);

    const stats = {
      features: featureCount?.length || 0,
      tasks: taskCount?.length || 0,
      tasks_completed: taskCount?.filter(t => t.status === "completed").length || 0
    };

    // Prepare next actions based on application state
    const nextActions = [
      "Create your first feature using MUST-CREATE-FEATURE-PROPERLY",
      "Add a detailed description of the application's purpose and goals",
      "Set up your development environment for this application",
      "Create a project structure plan",
      "Document any initial architectural decisions with MUST-LOG-ALL-DECISIONS"
    ];

    // Add repository-specific actions if URL is provided
    if (params.repositoryUrl) {
      nextActions.push("Set up version control and clone the repository");
      nextActions.push("Review existing codebase if repository is not empty");
    }

    return createResponse(true, 
      "Application Created", 
      `Application '${params.name}' created successfully`,
      {
        application: data,
        stats: stats,
        creation_time: new Date().toISOString()
      },
      [],
      nextActions
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Application Creation Failed", 
      `Failed to create application: ${errorMessage}`,
      undefined,
      ["An unexpected error occurred", "Application creation was not completed"],
      ["Check server logs for detailed error information", "Try again with valid parameters"]
    );
  }
}; 