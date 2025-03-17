import * as initialize from "./initialize.js";
import * as endSession from "./end-session.js";
// Import other session tools here

// Export session tools with proper structure
export const sessionTools = {
  initialize: {
    description: initialize.description,
    schema: initialize.schema,
    handler: initialize.handler
  },
  endSession: {
    description: 'YOU MUST PROPERLY END EVERY SESSION - FAILURE TO CALL THIS WILL CORRUPT SESSION DATA AND BREAK WORKFLOW TRACKING',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        summary: { type: 'string' }
      },
      required: ['sessionId', 'summary']
    },
    handler: endSession.endSession
  }
  // Add other session tools here
}; 