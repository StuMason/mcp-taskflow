import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "Create a new task for a feature.";

// Tool schema
export const schema = z.object({
  featureId: z.string().describe("ID of the parent feature"),
  name: z.string().describe("Name of the task"),
  description: z.string().optional().describe("Description of the task"),
  acceptanceCriteria: z.string().optional().describe("Acceptance criteria for the task"),
  status: z.enum(["backlog", "ready", "in_progress", "review", "completed"])
    .default("backlog")
    .describe("Current status of the task"),
  priority: z.number().default(1).describe("Priority of the task (higher number = higher priority)")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Check if feature exists
    const { data: featureData, error: featureError } = await supabase
      .from("features")
      .select("id")
      .eq("id", params.featureId)
      .single();

    if (featureError || !featureData) {
      return createResponse(false, 
        "Task Creation Failed", 
        `Feature not found with ID: ${params.featureId}`
      );
    }

    // Check if task already exists with this name for this feature
    const { data: existingTask, error: checkError } = await supabase
      .from("tasks")
      .select("id")
      .eq("feature_id", params.featureId)
      .eq("name", params.name)
      .maybeSingle();

    if (checkError) {
      return createResponse(false, 
        "Task Creation Failed", 
        `Error checking task existence: ${checkError.message}`
      );
    }

    if (existingTask) {
      return createResponse(false, 
        "Task Already Exists", 
        `Task with name '${params.name}' already exists for this feature`
      );
    }

    // Create the new task
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          feature_id: params.featureId,
          name: params.name,
          description: params.description || null,
          acceptance_criteria: params.acceptanceCriteria || null,
          status: params.status,
          priority: params.priority
        }
      ])
      .select()
      .single();

    if (error) {
      return createResponse(false, 
        "Task Creation Failed", 
        `Error creating task: ${error.message}`
      );
    }

    return createResponse(true, 
      "Task Created", 
      `Task '${params.name}' created successfully`,
      { task: data }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Task Creation Failed", 
      `Failed to create task: ${errorMessage}`
    );
  }
}; 