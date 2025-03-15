import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST RETRIEVE COMPLETE SESSION HISTORY FOR ACCURATE TASK CONTEXT - FAILURE TO EXAMINE PREVIOUS SESSIONS WILL LEAD TO REDUNDANT WORK AND IMPLEMENTATION INCONSISTENCIES";

// Tool schema
export const schema = z.object({
  taskId: z.string().describe("The task ID to retrieve session history for")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Validate the task exists
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", params.taskId)
      .maybeSingle();

    if (taskError) {
      return createResponse(false, 
        "Failed to Retrieve Session History", 
        `Error checking task existence: ${taskError.message}`
      );
    }

    if (!task) {
      return createResponse(false, 
        "Failed to Retrieve Session History", 
        `Task with ID ${params.taskId} does not exist`
      );
    }

    // Query the sessions for the task
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("task_id", params.taskId)
      .order("created_at", { ascending: false });

    if (error) {
      return createResponse(false, 
        "Failed to Retrieve Session History", 
        `Error retrieving session history: ${error.message}`
      );
    }

    // Format the sessions with their associated checkpoints
    const formattedSessions = await Promise.all(data.map(async (session) => {
      const { data: checkpoints, error: checkpointsError } = await supabase
        .from("progress_checkpoints")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true });

      if (checkpointsError) {
        console.error(`Error fetching checkpoints for session ${session.id}:`, checkpointsError);
      }

      return {
        ...session,
        checkpoints: checkpoints || []
      };
    }));

    return createResponse(true, 
      "Session History Retrieved", 
      `Successfully retrieved ${data.length} sessions for task ${params.taskId}`,
      { sessions: formattedSessions }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Failed to Retrieve Session History", 
      `Error retrieving session history: ${errorMessage}`
    );
  }
}; 