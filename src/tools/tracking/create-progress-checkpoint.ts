import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";
import { validateSession } from "../../utils/validation.js";

// Tool description
export const description = "Create a checkpoint to document progress. MUST be called every 3-5 minutes or after significant progress.";

// Tool schema
export const schema = z.object({
  sessionId: z.string().optional().describe("Your current session ID - include this to maintain continuity"),
  progress: z.string().describe("YOUR description of progress made so far - BE SPECIFIC about what YOU have accomplished"),
  changesDescription: z.string().describe("YOUR summary of changes YOU have made - DETAIL the files modified and how"),
  currentThinking: z.string().describe("YOUR current reasoning and plan - EXPLAIN your thought process clearly"),
  nextSteps: z.string().optional().describe("YOUR planned next actions - OUTLINE what you intend to do next")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Validate the session if ID is provided
    let sessionId = params.sessionId;
    if (params.sessionId) {
      const result = await validateSession(params.sessionId);
      
      if (!result.valid || result.error || !result.data) {
        return createResponse(false, 
          "Checkpoint Creation Failed", 
          result.error || "Invalid or expired session"
        );
      }
      
      sessionId = result.data.id;
    }

    // Create the checkpoint
    const { data, error } = await supabase
      .from("checkpoints")
      .insert([
        {
          session_id: sessionId,
          progress: params.progress,
          changes_description: params.changesDescription,
          current_thinking: params.currentThinking,
          next_steps: params.nextSteps || null
        }
      ])
      .select()
      .single();

    if (error) {
      return createResponse(false, 
        "Checkpoint Creation Failed", 
        `Error creating checkpoint: ${error.message}`
      );
    }

    return createResponse(true, 
      "Checkpoint Created", 
      "Progress checkpoint created successfully",
      { checkpoint: data }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Checkpoint Creation Failed", 
      `Failed to create progress checkpoint: ${errorMessage}`
    );
  }
}; 