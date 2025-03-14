import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { ZodRawShape } from "zod";
import supabase from "./src/lib/supabase-client.js";

// Define message types
interface SystemMessage {
  type: 'system_message';
  content: Array<{
    type: string;
    text: string;
  }>;
}

// Create the MCP server with proper message handling
const server = new McpServer({
  name: "Taskflow",
  version: "1.0.0",
  // Add custom message handler
  async onMessage(message: SystemMessage | unknown) {
    // Handle system messages
    if (typeof message === 'object' && message !== null && 'type' in message && message.type === 'system_message') {
      return {
        jsonrpc: "2.0",
        result: {
          type: "success",
          content: (message as SystemMessage).content
        }
      };
    }
    return null; // Let default handler process other messages
  }
});

server.tool(
  "record-file-change",
  "Record a file system change. MUST be called after every file operation (create/modify/delete).",
  {
    sessionId: z.string().optional().describe("Your current session ID - YOU MUST include this to maintain continuity"),
    filePath: z.string().describe("Path of the file YOU just created, modified or deleted - REQUIRED after ANY file operation"),
    changeType: z
      .enum(["created", "modified", "deleted"])
      .describe("Type of change YOU just performed - MUST be recorded for system integrity"),
  } as ZodRawShape,
  async (args) => {
    const { sessionId, filePath, changeType } = args;
    // Record the change in Supabase
    const { error } = await supabase
      .from('file_changes')
      .insert({
        session_id: sessionId || '',
        file_path: filePath,
        change_type: changeType,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error(`Error recording file change: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ YOU have recorded file change: "${filePath}" (${changeType}). REMEMBER: YOU MUST create a progress checkpoint soon to document your work. Use create-progress-checkpoint to maintain system integrity.`,
        },
      ],
    };
  }
);

server.tool(
  "create-progress-checkpoint",
  "Create a checkpoint to document progress. MUST be called every 3-5 minutes or after significant progress.",
  {
    sessionId: z.string().optional().describe("Your current session ID - include this to maintain continuity"),
    progress: z.string().describe("YOUR description of progress made so far - BE SPECIFIC about what YOU have accomplished"),
    changesDescription: z.string().describe("YOUR summary of changes YOU have made - DETAIL the files modified and how"),
    currentThinking: z.string().describe("YOUR current reasoning and plan - EXPLAIN your thought process clearly"),
    nextSteps: z.string().optional().describe("YOUR planned next actions - OUTLINE what you intend to do next"),
  } as ZodRawShape,
  async (args) => {
    const { sessionId, progress, changesDescription, currentThinking, nextSteps } = args;
    // Create checkpoint record in Supabase
    const timestamp = new Date().toISOString();
    
    const { error } = await supabase
      .from('checkpoints')
      .insert({
        session_id: sessionId || '',
        progress,
        changes_description: changesDescription,
        current_thinking: currentThinking,
        next_steps: nextSteps || '',
        timestamp
      });

    if (error) {
      console.error(`Error creating checkpoint: ${error.message}`);
    }
    
    return {
      content: [
        {
          type: "text",
          text: `✅ YOU have created a checkpoint at ${new Date(timestamp).toLocaleTimeString()}. REMEMBER: YOU MUST continue to call record-file-change after ANY file operations. Your next checkpoint should be created within 3-5 minutes or after significant progress.`,
        },
      ],
    };
  }
);

// Enhanced MCP tools for the expanded TaskFlow data model

// Tool definitions for application/feature/task management
server.tool(
    "get-applications",
    "Get a list of applications in the system.",
    {} as ZodRawShape,
    async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('name');
      
      if (error) {
        console.error(`Error getting applications: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve applications. Please check your connection and try again.",
            },
          ],
        };
      }
      
      return {
        applications: data,
        content: [
          {
            type: "text",
            text: data.length > 0
              ? `📚 Retrieved ${data.length} application(s):\n\n${data.map(app => `- ${app.name}: ${app.description || 'No description'}`).join('\n')}`
              : "No applications found. Use create-application to add one.",
          },
        ],
      };
    }
  );
  
  server.tool(
    "get-features",
    "Get features for an application.",
    {
      applicationId: z.string().describe("The application ID to get features for"),
    } as ZodRawShape,
    async (args) => {
      const { applicationId } = args;
      
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .eq('application_id', applicationId)
        .order('priority');
      
      if (error) {
        console.error(`Error getting features: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve features. Please check your connection and try again.",
            },
          ],
        };
      }
      
      return {
        features: data,
        content: [
          {
            type: "text",
            text: data.length > 0
              ? `🧩 Retrieved ${data.length} feature(s) for application ${applicationId}:\n\n${data.map(feature => `- ${feature.name} (${feature.status}): ${feature.description || 'No description'}`).join('\n')}`
              : `No features found for application ${applicationId}. Use create-feature to add one.`,
          },
        ],
      };
    }
  );
  
  server.tool(
    "get-tasks",
    "Get tasks for a feature.",
    {
      featureId: z.string().describe("The feature ID to get tasks for"),
    } as ZodRawShape,
    async (args) => {
      const { featureId } = args;
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('feature_id', featureId)
        .order('priority');
      
      if (error) {
        console.error(`Error getting tasks: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve tasks. Please check your connection and try again.",
            },
          ],
        };
      }
      
      return {
        tasks: data,
        content: [
          {
            type: "text",
            text: data.length > 0
              ? `📋 Retrieved ${data.length} task(s) for feature ${featureId}:\n\n${data.map(task => `- ${task.name} (${task.status}): ${task.description || 'No description'}`).join('\n')}`
              : `No tasks found for feature ${featureId}. Use create-task to add one.`,
          },
        ],
      };
    }
  );
  
  // Enhanced initialize-assistant with application, feature, and task linking
  server.tool(
    "initialize-assistant",
    "Initialize the assistant for a specific task type. MUST be called at the start of every conversation.",
    {
      taskType: z
        .enum(["code-editing", "planning", "research", "exploration"])
        .describe(
          "The type of task you (the assistant) are performing in this conversation - YOU MUST initialize before any other actions"
        ),
      contextDescription: z
        .string()
        .optional()
        .describe(
          "Brief description of what you (the assistant) will be helping with - provide context for better tracking"
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
    async (args) => {
      const { taskType, contextDescription, applicationId, featureId, taskId } = args;
      const sessionId =
        Date.now().toString(36) + Math.random().toString(36).substring(2);
  
      // Create new session in Supabase with enhanced fields
      const { error } = await supabase
        .from('sessions')
        .insert({
          id: sessionId,
          task_type: taskType,
          context_description: contextDescription || '',
          application_id: applicationId || null,
          feature_id: featureId || null,
          task_id: taskId || null,
          status: 'active',
          start_time: new Date().toISOString()
        });
  
      if (error) {
        console.error(`Error creating session: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to initialize session. Please check your connection and try again.",
            },
          ],
        };
      }
  
      // Prepare context information based on linked entities
      let contextInfo = '';
      
      if (taskId) {
        const { data: taskData } = await supabase
          .from('tasks')
          .select('name, description, acceptance_criteria, status')
          .eq('id', taskId)
          .single();
          
        if (taskData) {
          contextInfo += `\n\n📋 TASK CONTEXT: "${taskData.name}" (${taskData.status})
  ${taskData.description ? `Description: ${taskData.description}` : ''}
  ${taskData.acceptance_criteria ? `Acceptance Criteria: ${taskData.acceptance_criteria}` : ''}`;
        }
      }
      
      if (featureId) {
        const { data: featureData } = await supabase
          .from('features')
          .select('name, description, status')
          .eq('id', featureId)
          .single();
          
        if (featureData) {
          contextInfo += `\n\n🧩 FEATURE CONTEXT: "${featureData.name}" (${featureData.status})
  ${featureData.description ? `Description: ${featureData.description}` : ''}`;
        }
      }
      
      if (applicationId) {
        const { data: appData } = await supabase
          .from('applications')
          .select('name, description')
          .eq('id', applicationId)
          .single();
          
        if (appData) {
          contextInfo += `\n\n📚 APPLICATION CONTEXT: "${appData.name}"
  ${appData.description ? `Description: ${appData.description}` : ''}`;
        }
      }
  
      // Get previous sessions for the same task if applicable
      let previousSessionsInfo = '';
      
      if (taskId) {
        const { data: prevSessions } = await supabase
          .from('sessions')
          .select('id, start_time, end_time')
          .eq('task_id', taskId)
          .neq('id', sessionId)
          .order('start_time', { ascending: false })
          .limit(3);
          
        if (prevSessions && prevSessions.length > 0) {
          previousSessionsInfo = `\n\n🔄 PREVIOUS SESSIONS ON THIS TASK:
  ${prevSessions.map(s => `- Session ${s.id} (${new Date(s.start_time).toLocaleString()})`).join('\n')}`;
        }
      }
  
      return {
        sessionId,
        content: [
          {
            type: "text",
            text: `✅ YOU are now initialized for ${taskType} with session ID: ${sessionId}.${contextInfo}${previousSessionsInfo}\n\nREMEMBER: YOU MUST call record-file-change after ANY file operations and create-progress-checkpoint every 3-5 minutes. YOUR SESSION WILL BE INCOMPLETE without these calls.`,
          },
        ],
      };
    }
  );
  
  // Add new tools for snapshots and decisions
  server.tool(
    "create-snapshot",
    "Create a content snapshot of a file at the current point in time.",
    {
      sessionId: z.string().describe("Your current session ID - REQUIRED to link the snapshot"),
      filePath: z.string().describe("Path of the file to snapshot"),
      content: z.string().describe("The current content of the file"),
    } as ZodRawShape,
    async (args) => {
      const { sessionId, filePath, content } = args;
      
      if (!sessionId) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Error: Session ID is required to create a snapshot.",
            },
          ],
        };
      }
      
      const { error } = await supabase
        .from('snapshots')
        .insert({
          session_id: sessionId,
          file_path: filePath,
          content,
          timestamp: new Date().toISOString()
        });
      
      if (error) {
        console.error(`Error creating snapshot: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to create snapshot for ${filePath}. Please try again.`,
            },
          ],
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: `📸 Snapshot created for ${filePath}. The current state of this file has been recorded and can be referenced later.`,
          },
        ],
      };
    }
  );
  
  server.tool(
    "log-decision",
    "Log a key decision made during development.",
    {
      sessionId: z.string().describe("Your current session ID - REQUIRED to link the decision"),
      description: z.string().describe("Brief description of the decision made"),
      reasoning: z.string().describe("Detailed reasoning behind the decision"),
      alternatives: z.string().optional().describe("Alternative approaches that were considered"),
    } as ZodRawShape,
    async (args) => {
      const { sessionId, description, reasoning, alternatives } = args;
      
      if (!sessionId) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Error: Session ID is required to log a decision.",
            },
          ],
        };
      }
      
      const { error } = await supabase
        .from('decisions')
        .insert({
          session_id: sessionId,
          description,
          reasoning,
          alternatives: alternatives || null,
          timestamp: new Date().toISOString()
        });
      
      if (error) {
        console.error(`Error logging decision: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to log decision. Please try again.",
            },
          ],
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: `🧠 Decision logged: "${description}". This decision has been recorded for future reference and transparency.`,
          },
        ],
      };
    }
  );
  
  server.tool(
    "get-session-history",
    "Get historical sessions for a task.",
    {
      taskId: z.string().describe("The task ID to retrieve session history for"),
    } as ZodRawShape,
    async (args) => {
      const { taskId } = args;
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, start_time, end_time, status')
        .eq('task_id', taskId)
        .order('start_time', { ascending: false });
        
      if (sessionsError) {
        console.error(`Error getting session history: ${sessionsError.message}`);
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve session history. Please try again.",
            },
          ],
        };
      }
      
      if (!sessions || sessions.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No sessions found for task ${taskId}.`,
            },
          ],
        };
      }
      
      // For the most recent session, fetch checkpoints and file changes
      const recentSessionId = sessions[0].id;
      
      const { data: checkpoints, error: checkpointsError } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('session_id', recentSessionId)
        .order('timestamp');
        
      const { data: fileChanges, error: fileChangesError } = await supabase
        .from('file_changes')
        .select('*')
        .eq('session_id', recentSessionId)
        .order('timestamp');
        
      const { data: decisions, error: decisionsError } = await supabase
        .from('decisions')
        .select('*')
        .eq('session_id', recentSessionId)
        .order('timestamp');
      
      // Format response with detailed information
      let responseText = `# Session History for Task ${taskId}\n\n`;
      
      responseText += `## Sessions (${sessions.length})\n\n`;
      responseText += sessions.map(session => 
        `- ${session.id}: ${new Date(session.start_time).toLocaleString()} - ${session.end_time ? new Date(session.end_time).toLocaleString() : 'Ongoing'} (${session.status})`
      ).join('\n');
      
      if (checkpoints && checkpoints.length > 0) {
        responseText += `\n\n## Recent Checkpoints (${checkpoints.length})\n\n`;
        responseText += checkpoints.map((cp, i) => 
          `### Checkpoint ${i+1}: ${new Date(cp.timestamp).toLocaleString()}\n` +
          `- Progress: ${cp.progress}\n` +
          `- Changes: ${cp.changes_description}\n` +
          `${cp.next_steps ? `- Next Steps: ${cp.next_steps}` : ''}`
        ).join('\n\n');
      }
      
      if (fileChanges && fileChanges.length > 0) {
        responseText += `\n\n## Recent File Changes (${fileChanges.length})\n\n`;
        
        // Group by file path for clarity
        const fileGroups = fileChanges.reduce((acc, change) => {
          acc[change.file_path] = acc[change.file_path] || [];
          acc[change.file_path].push(change);
          return acc;
        }, {} as Record<string, typeof fileChanges>);
        
        for (const [filePath, changes] of Object.entries(fileGroups)) {
          responseText += `### ${filePath}\n`;
          responseText += (changes as Array<{ change_type: string; timestamp: string }>).map(change => 
            `- ${change.change_type.toUpperCase()} at ${new Date(change.timestamp).toLocaleString()}`
          ).join('\n');
          responseText += '\n\n';
        }
      }
      
      if (decisions && decisions.length > 0) {
        responseText += `\n\n## Recent Decisions (${decisions.length})\n\n`;
        responseText += decisions.map(decision => 
          `### ${decision.description}\n` +
          `- Reasoning: ${decision.reasoning}\n` +
          `${decision.alternatives ? `- Alternatives Considered: ${decision.alternatives}` : ''}` +
          `\n- Timestamp: ${new Date(decision.timestamp).toLocaleString()}`
        ).join('\n\n');
      }
      
      return {
        sessions,
        recentCheckpoints: checkpoints || [],
        recentFileChanges: fileChanges || [],
        recentDecisions: decisions || [],
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    }
  );

// Set up STDIO transport and connect
const transport = new StdioServerTransport();

server
  .connect(transport)
  .then(() => {
    console.error("TaskFlow MCP Server running on stdio");
  })
  .catch((error) => {
    console.error(`Error starting server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }); 