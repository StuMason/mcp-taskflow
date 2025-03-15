import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST GET ALL TASKS FOR A FEATURE - COMPREHENSIVE TASK AWARENESS IS ESSENTIAL FOR PROPER IMPLEMENTATION SEQUENCING AND WORKFLOW COMPLIANCE";

// Tool schema
export const schema = z.object({
  featureId: z.string().describe("The feature ID to get tasks for")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Validate the feature ID exists
    const { data: feature, error: featureError } = await supabase
      .from("features")
      .select("id")
      .eq("id", params.featureId)
      .maybeSingle();

    if (featureError) {
      return createResponse(false, 
        "Failed to Retrieve Tasks", 
        `Error checking feature existence: ${featureError.message}`
      );
    }

    if (!feature) {
      return createResponse(false, 
        "Failed to Retrieve Tasks", 
        `Feature with ID ${params.featureId} does not exist`
      );
    }

    // Query the tasks for the feature
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("feature_id", params.featureId)
      .order("created_at", { ascending: false });

    if (error) {
      return createResponse(false, 
        "Failed to Retrieve Tasks", 
        `Error retrieving tasks: ${error.message}`
      );
    }

    return createResponse(true, 
      "Tasks Retrieved", 
      `Successfully retrieved ${data.length} tasks for feature ${params.featureId}`,
      { tasks: data }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Failed to Retrieve Tasks", 
      `Error retrieving tasks: ${errorMessage}`
    );
  }
}; 