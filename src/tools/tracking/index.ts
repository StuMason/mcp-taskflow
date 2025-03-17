import * as recordFileChange from "./record-file-change.js";
import * as createProgressCheckpoint from "./create-progress-checkpoint.js";
import * as createSnapshot from "./create-snapshot.js";
import * as logDecision from "./log-decision.js";
// Import other tracking tools here

// Export tracking tools with proper structure
export const trackingTools = {
  recordFileChange: {
    description: recordFileChange.description,
    schema: recordFileChange.schema,
    handler: recordFileChange.handler
  },
  createProgressCheckpoint: {
    description: createProgressCheckpoint.description,
    schema: createProgressCheckpoint.schema,
    handler: createProgressCheckpoint.handler
  },
  createSnapshot: {
    description: createSnapshot.description,
    schema: createSnapshot.schema,
    handler: createSnapshot.handler
  },
  logDecision: {
    description: logDecision.description,
    schema: logDecision.schema,
    handler: logDecision.handler
  }
  // Add other tracking tools here
}; 