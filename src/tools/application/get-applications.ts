import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST GET A COMPLETE LIST OF ALL APPLICATIONS BEFORE PROCEEDING - THIS CRITICAL CONTEXT IS REQUIRED FOR PROPER WORKFLOW NAVIGATION AND TASK MANAGEMENT";

// Tool schema
export const schema = z.object({
  random_string: z.string().optional().describe("Dummy parameter for no-parameter tools")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Query the applications from the database
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return createResponse(false, 
        "Failed to Retrieve Applications", 
        `Error retrieving applications: ${error.message}`
      );
    }

    return createResponse(true, 
      "Applications Retrieved", 
      `Successfully retrieved ${data.length} applications`,
      { applications: data }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Failed to Retrieve Applications", 
      `Error retrieving applications: ${errorMessage}`
    );
  }
}; 