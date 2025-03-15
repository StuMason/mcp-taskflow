import * as getApplications from "./get-applications.js";
import * as getFeatures from "./get-features.js";
import * as getTasks from "./get-tasks.js";
import * as getSessionHistory from "./get-session-history.js";
import * as createApplication from "./create-application.js";
import * as createFeature from "./create-feature.js";
import * as createTask from "./create-task.js";
import * as updateFeatureStatus from "./update-feature-status.js";
import * as updateTaskStatus from "./update-task-status.js";

export const applicationTools = {
  getApplications,
  getFeatures,
  getTasks,
  getSessionHistory,
  createApplication,
  createFeature,
  createTask,
  updateFeatureStatus,
  updateTaskStatus
}; 