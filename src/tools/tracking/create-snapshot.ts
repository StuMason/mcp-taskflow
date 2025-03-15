import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";
import { validateSession } from "../../utils/validation.js";

// Tool description
export const description = "Create a content snapshot of a file at the current point in time.";

// Tool schema
export const schema = z.object({
  sessionId: z.string().describe("Your current session ID - REQUIRED to link the snapshot"),
  filePath: z.string().describe("Path of the file to snapshot"),
  content: z.string().describe("The current content of the file")
});

// Tool handler
export const handler = async (params: z.infer<typeof schema>): Promise<McpResponse> => {
  try {
    // Validate the session exists
    const result = await validateSession(params.sessionId);
    
    if (!result.valid || result.error || !result.data) {
      return createResponse(false, 
        "Snapshot Creation Failed", 
        result.error || "Invalid or expired session"
      );
    }

    const sessionId = result.data.id;

    // Create a hash of the content for lightweight comparison
    const contentHash = Buffer.from(params.content).toString('base64');

    // Check if a snapshot already exists with similar content for this file
    const { data: existingSnapshot, error } = await supabase
      .from("snapshots")
      .select("id, content_hash")
      .eq("session_id", sessionId)
      .eq("file_path", params.filePath)
      .eq("content_hash", contentHash)
      .maybeSingle();

    // If a snapshot with the same hash exists, don't create a duplicate
    if (!error && existingSnapshot) {
      return createResponse(false, 
        "Snapshot Already Exists", 
        `A snapshot with identical content already exists for ${params.filePath}`
      );
    }

    // If an error occurs that's not just "not found", return the error
    if (error && error.code !== "PGRST116") {
      return createResponse(false, 
        "Snapshot Creation Failed", 
        `Error checking for existing snapshots: ${error.message}`
      );
    }

    // Create the snapshot
    const { data, error: createError } = await supabase
      .from("snapshots")
      .insert([
        {
          session_id: sessionId,
          file_path: params.filePath,
          content: params.content,
          content_hash: contentHash
        }
      ])
      .select()
      .single();

    if (createError) {
      return createResponse(false, 
        "Snapshot Creation Failed", 
        `Error creating snapshot: ${createError.message}`
      );
    }

    return createResponse(true, 
      "Snapshot Created", 
      `Snapshot created successfully for file: ${params.filePath}`,
      { snapshot: data }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Snapshot Creation Failed", 
      `Failed to create snapshot: ${errorMessage}`
    );
  }
}; 