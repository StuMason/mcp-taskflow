import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "Update the status of a task.";

// Tool schema
export const schema = z.object({
  taskId: z.string().describe("ID of the task to update"),
  status: z.enum(["backlog", "ready", "in_progress", "review", "completed"])
    .describe("New status for the task")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Check if task exists
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status")
      .eq("id", params.taskId)
      .maybeSingle();

    if (taskError) {
      return createResponse(false, 
        "Task Status Update Failed", 
        `Error checking task existence: ${taskError.message}`
      );
    }

    if (!task) {
      return createResponse(false, 
        "Task Status Update Failed", 
        `Task with ID ${params.taskId} does not exist`
      );
    }

    // If status is already set to the requested value, return early
    if (task.status === params.status) {
      return createResponse(true, 
        "Task Status Updated", 
        `Task status is already set to '${params.status}'`
      );
    }

    // Update the task status
    const { data, error } = await supabase
      .from("tasks")
      .update({ status: params.status, updated_at: new Date().toISOString() })
      .eq("id", params.taskId)
      .select()
      .single();

    if (error) {
      return createResponse(false, 
        "Task Status Update Failed", 
        `Error updating task status: ${error.message}`
      );
    }

    return createResponse(true, 
      "Task Status Updated", 
      `Successfully updated task status from '${task.status}' to '${params.status}'`
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Task Status Update Failed", 
      `Failed to update task status: ${errorMessage}`
    );
  }
}; 