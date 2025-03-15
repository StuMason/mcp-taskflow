import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";
import { validateSession } from "../../utils/validation.js";

// Tool description
export const description = "YOU MUST PROPERLY END EVERY SESSION - FAILURE TO CALL THIS WILL CORRUPT SESSION DATA AND BREAK WORKFLOW TRACKING";

// Tool schema
export const schema = z.object({
  sessionId: z.string().describe("Your current session ID - REQUIRED to properly close the session"),
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
    
    // Get full session data including task and feature IDs
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
      
    if (sessionError || !sessionData) {
      return createResponse(false, 
        "Session End Failed", 
        `Error retrieving full session data: ${sessionError?.message || "Session not found"}`
      );
    }
    
    const taskId = sessionData.task_id;
    const featureId = sessionData.feature_id;
    
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

    // Default response actions
    let actions = [
      "Create a new session when you're ready to continue working"
    ];
    
    // Stats to include in the response
    const responseStats: Record<string, any> = { session: data };
    let nextTaskPrompt = "";
    
    // If this session was associated with a task, check for the next task in the feature
    if (taskId && featureId) {
      // Get current task details
      const { data: currentTask } = await supabase
        .from("tasks")
        .select("name, status, feature_id")
        .eq("id", taskId)
        .single();
      
      // Only look for next task if current task is completed
      if (currentTask && currentTask.status === "completed") {
        // Find the next task in the feature (not completed, ordered by priority)
        const { data: nextTasks } = await supabase
          .from("tasks")
          .select("id, name, description, status, priority, acceptance_criteria")
          .eq("feature_id", featureId)
          .neq("status", "completed")
          .order("priority", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1);
        
        if (nextTasks && nextTasks.length > 0) {
          const nextTask = nextTasks[0];
          
          // Get feature information
          const { data: feature } = await supabase
            .from("features")
            .select("name")
            .eq("id", featureId)
            .single();
          
          const featureName = feature ? feature.name : "unknown feature";
          
          // Create next task prompt
          nextTaskPrompt = `\n\n🔄 NEXT TASK: "${nextTask.name}"\n\nFeature: ${featureName}\nStatus: ${nextTask.status}\nPriority: ${nextTask.priority}${nextTask.description ? `\nDescription: ${nextTask.description}` : ''}${nextTask.acceptance_criteria ? `\nAcceptance Criteria: ${nextTask.acceptance_criteria}` : ''}`;
          
          // Add suggested task actions
          actions = [
            `Start working on the next task: "${nextTask.name}" (${nextTask.id})`,
            "Initialize a new session with MUST-INITIALIZE-SESSION for the next task",
            "Make sure to include the task ID in your initialization call"
          ];
          
          // Include next task info in stats
          responseStats.next_task = {
            id: nextTask.id,
            name: nextTask.name,
            status: nextTask.status,
            feature_id: featureId,
            feature_name: featureName
          };
        } else {
          // No more tasks in the feature - feature might be complete
          const { data: feature } = await supabase
            .from("features")
            .select("name, status")
            .eq("id", featureId)
            .single();
          
          if (feature) {
            if (feature.status !== "completed") {
              nextTaskPrompt = `\n\n🎉 FEATURE COMPLETION: "${feature.name}"\n\nAll tasks in this feature have been completed! Consider updating the feature status to 'completed'.`;
              
              actions = [
                `Update the feature status to 'completed' using MUST-UPDATE-FEATURE-STATUS`,
                "Start a new session for a different task or feature"
              ];
            } else {
              nextTaskPrompt = `\n\n✨ FEATURE ALREADY COMPLETED: "${feature.name}"\n\nThis feature is already marked as completed.`;
              
              actions = [
                "Start a new session for a different feature"
              ];
            }
          }
        }
      }
    }

    return createResponse(true, 
      "Session Ended", 
      `Session ended successfully${nextTaskPrompt}`,
      responseStats,
      [],
      actions
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Session End Failed", 
      `Failed to end session: ${errorMessage}`
    );
  }
}; 