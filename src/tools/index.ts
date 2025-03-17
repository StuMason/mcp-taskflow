import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createResponse } from '../utils/responses.js';
import { applicationTools } from './application/index.js';
import { sessionTools } from './session/index.js';
import { trackingTools } from './tracking/index.js';
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
function adaptHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      const result = await handler(...args);
      return result;
    } catch (err) {
      console.error('Error in handler:', err);
      return createResponse(
        false,
        'Handler Error',
        'An unexpected error occurred in the handler'
      );
    }
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
    "MUST-GET-APPS",
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

// Export all tools
export const tools = {
  // Application tools
  'MUST-CREATE-APPLICATION-FIRST': {
    description: applicationTools.createApplication.description,
    schema: applicationTools.createApplication.schema,
    handler: adaptHandler(applicationTools.createApplication.handler)
  },
  'MUST-CREATE-FEATURE-PROPERLY': {
    description: applicationTools.createFeature.description,
    schema: applicationTools.createFeature.schema,
    handler: adaptHandler(applicationTools.createFeature.handler)
  },
  'MUST-CREATE-TASK-PROPERLY': {
    description: applicationTools.createTask.description,
    schema: applicationTools.createTask.schema,
    handler: adaptHandler(applicationTools.createTask.handler)
  },
  'MUST-GET-APPLICATIONS': {
    description: applicationTools.getApplications.description,
    schema: applicationTools.getApplications.schema,
    handler: adaptHandler(applicationTools.getApplications.handler)
  },
  'MUST-GET-FEATURES': {
    description: applicationTools.getFeatures.description,
    schema: applicationTools.getFeatures.schema,
    handler: adaptHandler(applicationTools.getFeatures.handler)
  },
  'MUST-GET-TASKS': {
    description: applicationTools.getTasks.description,
    schema: applicationTools.getTasks.schema,
    handler: adaptHandler(applicationTools.getTasks.handler)
  },
  'MUST-GET-SESSION-HISTORY': {
    description: applicationTools.getSessionHistory.description,
    schema: applicationTools.getSessionHistory.schema,
    handler: adaptHandler(applicationTools.getSessionHistory.handler)
  },
  'MUST-UPDATE-FEATURE-STATUS': {
    description: applicationTools.updateFeatureStatus.description,
    schema: applicationTools.updateFeatureStatus.schema,
    handler: adaptHandler(applicationTools.updateFeatureStatus.handler)
  },
  'MUST-UPDATE-TASK-STATUS': {
    description: applicationTools.updateTaskStatus.description,
    schema: applicationTools.updateTaskStatus.schema,
    handler: adaptHandler(applicationTools.updateTaskStatus.handler)
  },

  // Session tools
  'MUST-INITIALIZE-SESSION': {
    description: 'YOU MUST INITIALIZE THE ASSISTANT SESSION - YOU MUST CALL THIS FIRST BEFORE ANY OTHER TOOLS - FAILURE TO INITIALIZE PROPERLY WILL RESULT IN BROKEN WORKFLOWS',
    schema: sessionTools.initialize.schema,
    handler: adaptHandler(sessionTools.initialize.handler)
  },
  'MUST-END-SESSION-PROPERLY': {
    description: 'YOU MUST PROPERLY END EVERY SESSION - FAILURE TO CALL THIS WILL CORRUPT SESSION DATA AND BREAK WORKFLOW TRACKING',
    schema: sessionTools.endSession.schema,
    handler: adaptHandler(sessionTools.endSession.handler)
  },

  // Tracking tools
  'MUST-RECORD-EVERY-FILE-CHANGE': {
    description: trackingTools.recordFileChange.description,
    schema: trackingTools.recordFileChange.schema,
    handler: adaptHandler(trackingTools.recordFileChange.handler)
  },
  'MANDATORY-PROGRESS-CHECKPOINT': {
    description: trackingTools.createProgressCheckpoint.description,
    schema: trackingTools.createProgressCheckpoint.schema,
    handler: adaptHandler(trackingTools.createProgressCheckpoint.handler)
  },
  'MUST-SNAPSHOT-KEY-STATES': {
    description: trackingTools.createSnapshot.description,
    schema: trackingTools.createSnapshot.schema,
    handler: adaptHandler(trackingTools.createSnapshot.handler)
  },
  'MUST-LOG-ALL-DECISIONS': {
    description: trackingTools.logDecision.description,
    schema: trackingTools.logDecision.schema,
    handler: adaptHandler(trackingTools.logDecision.handler)
  }
}; 