import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST GET ALL FEATURES FOR AN APPLICATION - FAILURE TO RETRIEVE THE COMPLETE FEATURE SET WILL RESULT IN INCOMPLETE CONTEXT AND FAULTY PLANNING";

// Tool schema
export const schema = z.object({
  applicationId: z.string().describe("The application ID to get features for")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Validate the application ID exists
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id")
      .eq("id", params.applicationId)
      .maybeSingle();

    if (appError) {
      return createResponse(false, 
        "Failed to Retrieve Features", 
        `Error checking application existence: ${appError.message}`
      );
    }

    if (!application) {
      return createResponse(false, 
        "Failed to Retrieve Features", 
        `Application with ID ${params.applicationId} does not exist`
      );
    }

    // Query the features for the application
    const { data, error } = await supabase
      .from("features")
      .select("*")
      .eq("application_id", params.applicationId)
      .order("created_at", { ascending: false });

    if (error) {
      return createResponse(false, 
        "Failed to Retrieve Features", 
        `Error retrieving features: ${error.message}`
      );
    }

    return createResponse(true, 
      "Features Retrieved", 
      `Successfully retrieved ${data.length} features for application ${params.applicationId}`,
      { features: data }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Failed to Retrieve Features", 
      `Error retrieving features: ${errorMessage}`
    );
  }
}; 