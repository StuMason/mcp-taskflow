import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";

// Tool description
export const description = "YOU MUST CREATE TASKS PROPERLY WITH CLEAR ACCEPTANCE CRITERIA - TASKS ARE THE FUNDAMENTAL UNITS OF WORK AND TRACKING - POORLY DEFINED TASKS LEAD TO IMPLEMENTATION FAILURES AND INCOMPLETE FEATURES";

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
    // Check if feature exists and get its details
    const { data: feature, error: featureError } = await supabase
      .from("features")
      .select(`
        id,
        name,
        description,
        status,
        priority,
        applications (
          id,
          name,
          description
        )
      `)
      .eq("id", params.featureId)
      .maybeSingle();

    if (featureError) {
      return createResponse(false, 
        "Task Creation Failed", 
        `Error checking feature existence: ${featureError.message}`,
        undefined,
        ["Database operation failed", "Feature may not exist"],
        ["Verify the feature ID is correct", "Use MUST-GET-FEATURES to list available features"]
      );
    }

    if (!feature) {
      return createResponse(false, 
        "Task Creation Failed", 
        `Feature with ID ${params.featureId} does not exist`,
        undefined,
        ["The specified feature ID was not found", "Tasks must be created within an existing feature"],
        ["Use MUST-GET-FEATURES to list available features", "Create the feature first using MUST-CREATE-FEATURE-PROPERLY"]
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
        `Error checking task existence: ${checkError.message}`,
        undefined,
        ["Database operation failed", "Task state is unknown"],
        ["Verify database connection", "Check error logs for details"]
      );
    }

    if (existingTask) {
      return createResponse(false, 
        "Task Already Exists", 
        `Task with name '${params.name}' already exists for this feature`,
        { existing_task_id: existingTask.id },
        ["A task with this name already exists in the feature", "Duplicate tasks are not allowed"],
        ["Use MUST-GET-TASKS to view existing tasks", "Choose a different name or work with the existing task"]
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
        `Error creating task: ${error.message}`,
        undefined,
        ["Database insert operation failed", "Task was not created"],
        ["Review the error message", "Verify all required fields are provided", "Try again with valid parameters"]
      );
    }

    // Map priority to descriptive label
    const priorityLabels = {
      1: "Critical",
      2: "High",
      3: "Medium",
      4: "Low",
      5: "Lowest/Chore"
    };

    // Get feature stats after task creation
    const { data: taskStats } = await supabase
      .from("tasks")
      .select("status")
      .eq("feature_id", params.featureId);

    const stats = {
      total_tasks: taskStats?.length || 0,
      tasks_by_status: {
        backlog: taskStats?.filter(t => t.status === "backlog").length || 0,
        ready: taskStats?.filter(t => t.status === "ready").length || 0,
        in_progress: taskStats?.filter(t => t.status === "in_progress").length || 0,
        review: taskStats?.filter(t => t.status === "review").length || 0,
        completed: taskStats?.filter(t => t.status === "completed").length || 0
      }
    };

    // Prepare next actions based on task state
    const nextActions = [
      "Document implementation details and approach",
      "Set up necessary development environment",
      "Create required test cases"
    ];

    // Add status-specific actions
    if (params.status === "backlog") {
      nextActions.push("Review and refine task requirements");
      nextActions.push("Update status to 'ready' when requirements are clear");
    } else if (params.status === "ready") {
      nextActions.push("Begin implementation by updating status to 'in_progress'");
      nextActions.push("Set up progress tracking with MANDATORY-PROGRESS-CHECKPOINT");
    } else if (params.status === "in_progress") {
      nextActions.push("Track progress with MANDATORY-PROGRESS-CHECKPOINT");
      nextActions.push("Document decisions with MUST-LOG-ALL-DECISIONS");
      nextActions.push("Update status to 'review' when implementation is complete");
    }

    // Add missing information actions
    if (!params.description) {
      nextActions.push("Add a detailed description of the task requirements");
    }
    if (!params.acceptanceCriteria) {
      nextActions.push("Define clear acceptance criteria for task completion");
    }

    // Check if feature status needs updating
    if (feature.status === "planned" && params.status !== "backlog") {
      nextActions.push("Consider updating feature status to 'in_progress'");
    }

    return createResponse(true, 
      "Task Created", 
      `Task '${params.name}' created successfully in feature '${feature.name}'`,
      {
        task: {
          ...data,
          priority: `${data.priority} (${priorityLabels[data.priority as keyof typeof priorityLabels] || `Priority ${data.priority}`})`
        },
        feature: {
          id: feature.id,
          name: feature.name,
          description: feature.description,
          status: feature.status,
          priority: `${feature.priority} (${priorityLabels[feature.priority as keyof typeof priorityLabels] || `Priority ${feature.priority}`})`
        },
        application: feature.applications,
        stats: stats,
        creation_time: new Date().toISOString()
      },
      [],
      nextActions
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return createResponse(false, 
      "Task Creation Failed", 
      `Failed to create task: ${errorMessage}`,
      undefined,
      ["An unexpected error occurred", "Task creation was not completed"],
      ["Check server logs for detailed error information", "Try again with valid parameters"]
    );
  }
}; 