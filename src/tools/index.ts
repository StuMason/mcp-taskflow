import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sessionTools } from "./session/index.js";
import { trackingTools } from "./tracking/index.js";
import { applicationTools } from "./application/index.js";
import { schemas } from "../utils/responses.js";
import { ZodRawShape } from "zod";
import { logMessage } from "../utils/logging.js";
// Import other tool categories

// Type for McpResponse from our utils
import { McpResponse } from "../utils/responses.js";

// Type for RequestHandlerExtra from the MCP SDK
type RequestHandlerExtra = {
  baseUrl: string;
  requestId: string;
  timestamp: number;
};

// Helper function to adapt our handlers to the MCP server expected format
function adaptHandler(handler: any) {
  // @ts-ignore - Ignore typescript errors since we know this function will work properly
  return async (args: Record<string, any>, extra: any): Promise<McpResponse> => {
    return await handler(args);
  };
}

export function registerTools(server: McpServer) {
  // Register session tools
  server.tool(
    "MUST-INITIALIZE-SESSION", 
    sessionTools.initialize.description, 
    schemas.session.initialize, 
    adaptHandler(sessionTools.initialize.handler)
  );
  
  server.tool(
    "MUST-END-SESSION-PROPERLY",
    sessionTools.endSession.description,
    schemas.session.end, 
    adaptHandler(sessionTools.endSession.handler)
  );
  
  // Register tracking tools
  server.tool(
    "MUST-RECORD-EVERY-FILE-CHANGE",
    trackingTools.recordFileChange.description,
    schemas.tracking.recordFileChange, 
    adaptHandler(trackingTools.recordFileChange.handler)
  );
  
  server.tool(
    "MANDATORY-PROGRESS-CHECKPOINT",
    trackingTools.createProgressCheckpoint.description,
    schemas.tracking.createProgressCheckpoint, 
    adaptHandler(trackingTools.createProgressCheckpoint.handler)
  );
  
  server.tool(
    "MUST-SNAPSHOT-KEY-STATES",
    trackingTools.createSnapshot.description,
    schemas.tracking.createSnapshot, 
    adaptHandler(trackingTools.createSnapshot.handler)
  );
  
  server.tool(
    "MUST-LOG-ALL-DECISIONS",
    trackingTools.logDecision.description,
    schemas.tracking.logDecision, 
    adaptHandler(trackingTools.logDecision.handler)
  );
  
  // Register application tools
  server.tool(
    "MUST-GET-APPLICATIONS",
    applicationTools.getApplications.description,
    schemas.application.getApplications, 
    adaptHandler(applicationTools.getApplications.handler)
  );
  
  server.tool(
    "MUST-GET-FEATURES",
    applicationTools.getFeatures.description,
    schemas.application.getFeatures, 
    adaptHandler(applicationTools.getFeatures.handler)
  );
  
  server.tool(
    "MUST-GET-TASKS",
    applicationTools.getTasks.description,
    schemas.application.getTasks, 
    adaptHandler(applicationTools.getTasks.handler)
  );
  
  server.tool(
    "MUST-GET-SESSION-HISTORY",
    applicationTools.getSessionHistory.description,
    schemas.application.getSessionHistory, 
    adaptHandler(applicationTools.getSessionHistory.handler)
  );
  
  server.tool(
    "MUST-CREATE-APPLICATION-FIRST",
    applicationTools.createApplication.description,
    schemas.application.createApplication, 
    adaptHandler(applicationTools.createApplication.handler)
  );
  
  server.tool(
    "MUST-CREATE-FEATURE-PROPERLY",
    applicationTools.createFeature.description,
    schemas.application.createFeature, 
    adaptHandler(applicationTools.createFeature.handler)
  );
  
  server.tool(
    "MUST-CREATE-TASK-PROPERLY",
    applicationTools.createTask.description,
    schemas.application.createTask, 
    adaptHandler(applicationTools.createTask.handler)
  );
  
  server.tool(
    "MUST-UPDATE-FEATURE-STATUS",
    applicationTools.updateFeatureStatus.description,
    schemas.application.updateFeatureStatus, 
    adaptHandler(applicationTools.updateFeatureStatus.handler)
  );
  
  server.tool(
    "MUST-UPDATE-TASK-STATUS",
    applicationTools.updateTaskStatus.description,
    schemas.application.updateTaskStatus, 
    adaptHandler(applicationTools.updateTaskStatus.handler)
  );
  
  logMessage('info', 'All tools registered successfully');
} 