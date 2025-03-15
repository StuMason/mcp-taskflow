import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";
import { validateSession } from "../../utils/validation.js";

// Tool description
export const description = "YOU MUST LOG ALL SIGNIFICANT DECISIONS - FAILURE TO DOCUMENT KEY DECISIONS WILL RESULT IN UNTRACEABLE RATIONALE AND IMPLEMENTATION CONFUSION";

// Tool schema
export const schema = z.object({
  sessionId: z.string().describe("Your current session ID - REQUIRED to link the decision"),
  description: z.string().describe("Brief description of the decision made"),
  reasoning: z.string().describe("Detailed reasoning behind the decision"),
  alternatives: z.string().optional().describe("Alternative approaches that were considered")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Validate the session exists
    const result = await validateSession(params.sessionId);
    
    if (!result.valid || result.error || !result.data) {
      return createResponse(false, 
        "Decision Logging Failed", 
        result.error || "Invalid or expired session"
      );
    }

    const sessionId = result.data.id;
    // Create the decision log
    const { data, error } = await supabase
      .from("decisions")
      .insert([
        {
          session_id: sessionId,
          description: params.description,
          reasoning: params.reasoning,
          alternatives: params.alternatives || null
        }
      ])
      .select()
      .single();

    if (error) {
      return createResponse(false, 
        "Decision Logging Failed", 
        `Error logging decision: ${error.message}`
      );
    }

    return createResponse(true, 
      "Decision Logged", 
      "Decision logged successfully",
      { decision: data }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Decision Logging Failed", 
      `Failed to log decision: ${errorMessage}`
    );
  }
}; 