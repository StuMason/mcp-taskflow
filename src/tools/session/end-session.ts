import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";
import { validateSession } from "../../utils/validation.js";

// Tool description
export const description = "End the current session and mark it as completed.";

// Tool schema
export const schema = z.object({
  sessionId: z.string().describe("Your current session ID to end"),
  summary: z.string().describe("Summary of what was accomplished in this session")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Validate the session exists
    const result = await validateSession(params.sessionId);
    
    if (!result.valid || result.error || !result.data) {
      return createResponse(false, 
        "Session End Failed", 
        result.error || "Invalid or expired session"
      );
    }

    const sessionId = result.data.id;

    // Update the session to mark it as completed
    const { data, error } = await supabase
      .from("sessions")
      .update({ 
        status: "completed",
        end_time: new Date().toISOString(),
        summary: params.summary
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      return createResponse(false, 
        "Session End Failed", 
        `Error ending session: ${error.message}`
      );
    }

    return createResponse(true, 
      "Session Ended", 
      "Session ended successfully",
      { session: data }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Session End Failed", 
      `Failed to end session: ${errorMessage}`
    );
  }
}; 