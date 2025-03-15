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
    // Check if application exists
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id")
      .eq("id", params.applicationId)
      .maybeSingle();

    if (appError) {
      return createResponse(false, 
        "Feature Creation Failed", 
        `Error checking application existence: ${appError.message}`
      );
    }

    if (!application) {
      return createResponse(false, 
        "Feature Creation Failed", 
        `Application with ID ${params.applicationId} does not exist`
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
        `Error checking feature existence: ${checkError.message}`
      );
    }

    if (existingFeature) {
      return createResponse(false, 
        "Feature Already Exists", 
        `Feature with name '${params.name}' already exists for this application`
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
        `Error creating feature: ${error.message}`
      );
    }

    return createResponse(true, 
      "Feature Created", 
      `Feature '${params.name}' created successfully`,
      { feature: data }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Feature Creation Failed", 
      `Failed to create feature: ${errorMessage}`
    );
  }
}; 