import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "Create a new application in the system.";

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
        `Error checking application existence: ${checkError.message}`
      );
    }

    if (existingApp) {
      return createResponse(false, 
        "Application Already Exists", 
        `Application with name '${params.name}' already exists`
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
        `Error creating application: ${error.message}`
      );
    }

    return createResponse(true, 
      "Application Created", 
      `Application '${params.name}' created successfully`,
      { application: data }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Application Creation Failed", 
      `Failed to create application: ${errorMessage}`
    );
  }
}; 