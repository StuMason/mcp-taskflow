import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "Update the status of a feature.";

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
      .select("id, status")
      .eq("id", params.featureId)
      .maybeSingle();

    if (featureError) {
      return createResponse(false, 
        "Feature Status Update Failed", 
        `Error checking feature existence: ${featureError.message}`
      );
    }

    if (!feature) {
      return createResponse(false, 
        "Feature Status Update Failed", 
        `Feature with ID ${params.featureId} does not exist`
      );
    }

    // If status is already set to the requested value, return early
    if (feature.status === params.status) {
      return createResponse(true, 
        "Feature Status Updated", 
        `Feature status is already set to '${params.status}'`
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
      return createResponse(false, 
        "Feature Status Update Failed", 
        `Error updating feature status: ${error.message}`
      );
    }

    return createResponse(true, 
      "Feature Status Updated", 
      `Successfully updated feature status from '${feature.status}' to '${params.status}'`
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Feature Status Update Failed", 
      `Failed to update feature status: ${errorMessage}`
    );
  }
}; 