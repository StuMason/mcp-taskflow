-- TaskFlow Combined Migration
-- This file combines multiple migrations into a single coherent schema

-- =============================================
-- Initial Schema - Core Session Tracking
-- =============================================

-- Sessions table - tracks AI working periods
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  context_description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  summary TEXT,
  last_checkpoint_at TIMESTAMP WITH TIME ZONE,
  last_file_change_at TIMESTAMP WITH TIME ZONE,
  last_decision_at TIMESTAMP WITH TIME ZONE,
  compliance_score INTEGER DEFAULT 100
);

-- File changes table - records modifications to files
CREATE TABLE file_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(id),
  file_path TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'modified', 'deleted')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Checkpoints table - captures progress at specific points in time
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(id),
  progress TEXT NOT NULL,
  changes_description TEXT NOT NULL,
  current_thinking TEXT NOT NULL,
  next_steps TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- Hierarchy Structure - Applications, Features, Tasks
-- =============================================

-- Applications table (top level - represents software products)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  repository_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Features table (second level - major functionality groups within an application)
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'abandoned')),
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tasks table (third level - specific work items within a feature)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  status TEXT NOT NULL CHECK (status IN ('backlog', 'ready', 'in_progress', 'review', 'completed')),
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Link sessions to the hierarchy
ALTER TABLE sessions ADD COLUMN task_id UUID REFERENCES tasks(id);
ALTER TABLE sessions ADD COLUMN application_id UUID REFERENCES applications(id);
ALTER TABLE sessions ADD COLUMN feature_id UUID REFERENCES features(id);

-- =============================================
-- Additional Tracking - Snapshots and Decisions
-- =============================================

-- Snapshots table - point-in-time content snapshots of modified files
CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT, -- Base64 encoded hash for comparison and deduplication
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Decision Log table - for tracking key decisions
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  alternatives TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- Extended Features - Feedback and Validation
-- =============================================

-- Feedback table for tracking success/failure of strategies
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'neutral')),
  description TEXT NOT NULL,
  reusability_score INTEGER CHECK (reusability_score BETWEEN 1 AND 10),
  applicable_task_types TEXT[] NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Scope validation events for tracking scope compliance
CREATE TABLE scope_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  validation_type TEXT NOT NULL CHECK (validation_type IN ('scope_check', 'checkpoint_reminder', 'file_verification')),
  result TEXT NOT NULL CHECK (result IN ('pass', 'warning', 'violation')),
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Task Requirements table for more structured task definition
CREATE TABLE task_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('functional', 'non_functional', 'constraint')),
  description TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- Indexes - Performance Optimization
-- =============================================

-- Session related indexes
CREATE INDEX idx_sessions_task_id ON sessions(task_id);
CREATE INDEX idx_sessions_application_id ON sessions(application_id);
CREATE INDEX idx_sessions_feature_id ON sessions(feature_id);

-- File change related indexes
CREATE INDEX idx_file_changes_session_id ON file_changes(session_id);
CREATE INDEX idx_file_changes_file_path ON file_changes(file_path);

-- Checkpoint related indexes
CREATE INDEX idx_checkpoints_session_id ON checkpoints(session_id);

-- Hierarchy related indexes
CREATE INDEX idx_features_application_id ON features(application_id);
CREATE INDEX idx_tasks_feature_id ON tasks(feature_id);

-- Snapshot related indexes
CREATE INDEX idx_snapshots_session_id ON snapshots(session_id);
CREATE INDEX idx_snapshots_file_path ON snapshots(file_path);

-- Decision related indexes
CREATE INDEX idx_decisions_session_id ON decisions(session_id);

-- Feedback related indexes
CREATE INDEX idx_feedback_session_id ON feedback(session_id);
CREATE INDEX idx_feedback_decision_id ON feedback(decision_id);
CREATE INDEX idx_feedback_applicable_task_types ON feedback USING GIN(applicable_task_types);
CREATE INDEX idx_feedback_tags ON feedback USING GIN(tags);

-- Validation related indexes
CREATE INDEX idx_scope_validations_session_id ON scope_validations(session_id);
CREATE INDEX idx_task_requirements_task_id ON task_requirements(task_id);

-- =============================================
-- Documentation - Table and Column Comments
-- =============================================

-- Core tables
COMMENT ON TABLE sessions IS 'Tracks assistant sessions';
COMMENT ON COLUMN sessions.summary IS 'Summary of what was accomplished in the session';
COMMENT ON COLUMN sessions.compliance_score IS 'Score from 0-100 indicating adherence to workflow protocols';

COMMENT ON TABLE file_changes IS 'Records modifications to files';
COMMENT ON TABLE checkpoints IS 'Captures progress at specific points in time';

-- Hierarchy tables
COMMENT ON TABLE applications IS 'Top-level software products being developed';
COMMENT ON TABLE features IS 'Major functionality groups within applications';
COMMENT ON TABLE tasks IS 'Specific work items within features';

-- Tracking tables
COMMENT ON TABLE snapshots IS 'Point-in-time content snapshots of modified files';
COMMENT ON COLUMN snapshots.content_hash IS 'Base64 encoded hash of content for comparison and deduplication';
COMMENT ON TABLE decisions IS 'Key decisions made during development sessions';

-- Extended feature tables
COMMENT ON TABLE feedback IS 'Tracks effectiveness of decisions and strategies for reuse';
COMMENT ON TABLE scope_validations IS 'Logs compliance checks and warnings about scope violations';
COMMENT ON TABLE task_requirements IS 'Detailed requirements for tasks to enable better validation';