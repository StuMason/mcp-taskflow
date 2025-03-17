import { z } from "zod";
import type { ZodRawShape } from "zod";

// Define the content types that MCP server expects
export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image";
  data: string;
  mimeType: string;
};

export type ResourceContent = {
  type: "resource";
  resource: {
    text: string;
    uri: string;
    mimeType?: string;
  };
};

export type ContentItem = TextContent | ImageContent | ResourceContent;

export type McpResponse = {
  content: ContentItem[];
  [key: string]: any;
};

// Function to create standardized responses
export function createResponse(
  success: boolean,
  title: string,
  details: string,
  stats?: Record<string, any>,
  warnings: string[] = [],
  actions: string[] = []
): McpResponse {
  const emoji = success ? "✅" : "❌";
  
  // Format warnings with emoji
  const warningSection = warnings.length > 0 
    ? `\n\n⚠️ WARNINGS:\n${warnings.map(w => `- ${w}`).join('\n')}` 
    : '';
  
  // Format required actions with emoji
  const actionSection = actions.length > 0
    ? `\n\n🔔 REQUIRED ACTIONS:\n${actions.map(a => `- ${a}`).join('\n')}` 
    : '';
  
  // Format stats in a consistent way
  let statsSection = '';
  if (stats) {
    const formattedStats = Object.entries(stats)
      .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
      .join('\n');
    statsSection = `\n\n📊 STATS:\n${formattedStats}`;
  }
  
  return {
    content: [
      {
        type: "text" as const,
        text: `${emoji} ${title.toUpperCase()}\n\n${details}${statsSection}${warningSection}${actionSection}`
      }
    ]
  };
}

// Tool schema definitions
export const schemas = {
  session: {
    initialize: {
      taskType: z
        .enum(["code-editing", "planning", "research", "exploration"])
        .describe(
          "The type of task you (the assistant) are performing - YOU MUST specify correctly"
        ),
      contextDescription: z
        .string()
        .optional()
        .describe(
          "Brief description of what you will be doing - BE SPECIFIC and DETAILED"
        ),
      applicationId: z
        .string()
        .optional()
        .describe(
          "The ID of the application you are working on"
        ),
      featureId: z
        .string()
        .optional()
        .describe(
          "The ID of the feature you are working on"
        ),
      taskId: z
        .string()
        .optional()
        .describe(
          "The ID of the specific task you are working on"
        ),
    } as ZodRawShape,
    checkpoint: {
      sessionId: z.string().describe("Your current session ID - REQUIRED to maintain continuity"),
      progress: z.string().describe("YOUR description of progress made so far - BE SPECIFIC about what YOU have accomplished"),
      changesDescription: z.string().describe("YOUR summary of changes YOU have made - DETAIL the files modified and how"),
      currentThinking: z.string().describe("YOUR current reasoning and plan - EXPLAIN your thought process clearly"),
      nextSteps: z.string().optional().describe("YOUR planned next actions - OUTLINE what you intend to do next"),
    } as ZodRawShape,
    end: {
      sessionId: z.string().describe("Your current session ID - REQUIRED to properly close the session"),
      summary: z.string().describe("Summary of what was accomplished in this session")
    } as ZodRawShape
  },
  tracking: {
    recordFileChange: {
      sessionId: z.string().describe("Your current session ID - YOU MUST include this to maintain continuity"),
      filePath: z.string().describe("Path of the file YOU just created, modified or deleted - REQUIRED after ANY file operation"),
      changeType: z
        .enum(["created", "modified", "deleted"])
        .describe("Type of change YOU just performed - MUST be recorded for system integrity"),
    } as ZodRawShape,
    createSnapshot: {
      sessionId: z.string().describe("Your current session ID - REQUIRED to link the snapshot"),
      filePath: z.string().describe("Path of the file to snapshot"),
      content: z.string().describe("The current content of the file"),
    } as ZodRawShape,
    logDecision: {
      sessionId: z.string().describe("Your current session ID - REQUIRED to link the decision"),
      description: z.string().describe("Brief description of the decision made"),
      reasoning: z.string().describe("Detailed reasoning behind the decision"),
      alternatives: z.string().optional().describe("Alternative approaches that were considered"),
    } as ZodRawShape,
    createProgressCheckpoint: {
      sessionId: z.string().optional().describe("Your current session ID - include this to maintain continuity"),
      progress: z.string().describe("YOUR description of progress made so far - BE SPECIFIC about what YOU have accomplished"),
      changesDescription: z.string().describe("YOUR summary of changes YOU have made - DETAIL the files modified and how"),
      currentThinking: z.string().describe("YOUR current reasoning and plan - EXPLAIN your thought process clearly"),
      nextSteps: z.string().optional().describe("YOUR planned next actions - OUTLINE what you intend to do next")
    } as ZodRawShape
  },
  validation: {
    verifyScopeCompliance: {
      sessionId: z.string().describe("Your current session ID - REQUIRED for verification"),
      filePath: z.string().describe("Path of the file you want to modify"),
      operation: z.enum(["create", "modify", "delete"]).describe("The operation you want to perform"),
      reason: z.string().describe("Why this operation is necessary for your assigned task"),
    } as ZodRawShape,
    checkTimeboxing: {
      sessionId: z.string().describe("Your current session ID - REQUIRED for verification"),
    } as ZodRawShape
  },
  knowledge: {
    reviewSuccessfulStrategies: {
      sessionId: z.string().describe("Your current session ID - REQUIRED"),
      taskType: z.enum(["code-editing", "planning", "research", "exploration"])
        .describe("Type of task - MUST match initialization"),
      featureId: z.string().optional().describe("Feature ID if available"),
    } as ZodRawShape,
    recordFeedback: {
      sessionId: z.string().describe("Your current session ID - REQUIRED"),
      decisionId: z.string().optional().describe("Decision this feedback relates to"),
      feedbackType: z.enum(["positive", "negative", "neutral"]).describe("Type of feedback"),
      description: z.string().describe("Description of what worked or didn't work"),
      reusabilityScore: z.number().min(1).max(10).optional().describe("How reusable is this approach (1-10)"),
      applicableTaskTypes: z.array(z.string()).describe("Task types this feedback applies to"),
      tags: z.array(z.string()).optional().describe("Tags for categorizing this feedback"),
    } as ZodRawShape
  },
  application: {
    getApplications: {
      random_string: z.string().optional().describe("Dummy parameter for no-parameter tools")
    } as ZodRawShape,
    getFeatures: {
      applicationId: z.string().describe("The application ID to get features for")
    } as ZodRawShape,
    getTasks: {
      featureId: z.string().describe("The feature ID to get tasks for")
    } as ZodRawShape, 
    getSessionHistory: {
      taskId: z.string().describe("The task ID to retrieve session history for")
    } as ZodRawShape,
    createApplication: {
      name: z.string().describe("Name of the application"),
      description: z.string().optional().describe("Description of the application"),
      repositoryUrl: z.string().optional().describe("URL to the application's repository")
    } as ZodRawShape,
    createFeature: {
      applicationId: z.string().describe("ID of the parent application"),
      name: z.string().describe("Name of the feature"),
      description: z.string().optional().describe("Description of the feature"),
      status: z.enum(["planned", "in_progress", "completed", "abandoned"])
        .default("planned")
        .describe("Current status of the feature"),
      priority: z.number().default(1).describe("Priority of the feature (higher number = higher priority)")
    } as ZodRawShape,
    createTask: {
      featureId: z.string().describe("ID of the parent feature"),
      name: z.string().describe("Name of the task"),
      description: z.string().optional().describe("Description of the task"),
      acceptanceCriteria: z.string().optional().describe("Acceptance criteria for the task"),
      status: z.enum(["backlog", "ready", "in_progress", "review", "completed"])
        .default("backlog")
        .describe("Current status of the task"),
      priority: z.number().default(1).describe("Priority of the task (higher number = higher priority)")
    } as ZodRawShape,
    updateFeatureStatus: {
      featureId: z.string().describe("ID of the feature to update"),
      status: z.enum([
        "planned",
        "backlog",
        "ready",
        "in_progress",
        "blocked",
        "on_hold",
        "in_review",
        "completed",
        "wont_do",
        "abandoned",
        "archived"
      ]).describe("New status for the feature"),
      blockingReason: z.string().optional().describe("Reason why the feature is blocked (required if status is 'blocked')"),
      blockedById: z.string().optional().describe("ID of the feature blocking this one (required if status is 'blocked')")
    } as ZodRawShape,
    updateTaskStatus: {
      taskId: z.string().describe("ID of the task to update"),
      status: z.enum([
        "backlog",
        "ready",
        "blocked",
        "on_hold",
        "in_progress",
        "in_review",
        "needs_revision",
        "completed",
        "wont_do",
        "abandoned",
        "archived"
      ]).describe("New status for the task"),
      blockingReason: z.string().optional().describe("Reason why the task is blocked (required if status is 'blocked')"),
      blockedById: z.string().optional().describe("ID of the task blocking this one (required if status is 'blocked')")
    } as ZodRawShape
  }
}; 