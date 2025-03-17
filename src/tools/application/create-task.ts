import { schemas, createResponse, McpResponse } from "../../utils/responses.js";
import { z } from "zod";
import supabase from "../../lib/supabase-client.js";
import { Database } from '../../lib/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

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
    // Validate required parameters
    if (!params.featureId) {
      return createResponse(
        false,
        'Missing feature ID',
        'Please provide a feature ID'
      );
    }

    if (!params.name) {
      return createResponse(
        false,
        'Missing task name',
        'Please provide a task name'
      );
    }

    // Check if feature exists
    const { data: feature, error: featureError } = await supabase
      .from('features')
      .select('*')
      .eq('id', params.featureId)
      .single();

    if (featureError || !feature) {
      return createResponse(
        false,
        'Feature not found',
        'Please check the feature ID'
      );
    }

    // Create task
    const taskData: TaskInsert = {
      feature_id: params.featureId,
      name: params.name,
      description: params.description || null,
      acceptance_criteria: params.acceptanceCriteria || null,
      status: 'backlog',
      priority: params.priority || 1
    };

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskError) {
      return createResponse(
        false,
        'Failed to create task',
        'Please try again'
      );
    }

    // Get task stats
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('feature_id', params.featureId);

    const taskStats = {
      total: tasks?.length || 0,
      backlog: tasks?.filter(t => t.status === 'backlog').length || 0,
      ready: tasks?.filter(t => t.status === 'ready').length || 0,
      in_progress: tasks?.filter(t => t.status === 'in_progress').length || 0,
      in_review: tasks?.filter(t => t.status === 'in_review').length || 0,
      completed: tasks?.filter(t => t.status === 'completed').length || 0
    };

    // Map priority to descriptive label
    const priorityLabels = {
      1: "Critical",
      2: "High",
      3: "Medium",
      4: "Low",
      5: "Lowest/Chore"
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

    return createResponse(
      true,
      'Task created successfully',
      'You can now start working on the task',
      {
        task: {
          ...task,
          priority: `${task.priority} (${priorityLabels[task.priority as keyof typeof priorityLabels] || `Priority ${task.priority}`})`
        },
        feature: {
          id: feature.id,
          name: feature.name,
          description: feature.description,
          status: feature.status,
          priority: `${feature.priority} (${priorityLabels[feature.priority as keyof typeof priorityLabels] || `Priority ${feature.priority}`})`
        },
        application: feature.applications,
        stats: taskStats,
        creation_time: new Date().toISOString()
      },
      [],
      nextActions
    );
  } catch (err) {
    console.error('Error creating task:', err);
    return createResponse(
      false,
      'Failed to create task',
      'An unexpected error occurred'
    );
  }
}; 