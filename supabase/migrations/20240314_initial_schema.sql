-- TaskFlow Combined Migration
-- This file combines multiple migrations into a single coherent schema

-- =============================================
-- Custom Types
-- =============================================

-- Create feature status enum
CREATE TYPE feature_status AS ENUM (
  'planned',
  'backlog',
  'ready',
  'in_progress',
  'blocked',
  'on_hold',
  'in_review',
  'completed',
  'wont_do',
  'abandoned',
  'archived'
);

-- Create task status enum
CREATE TYPE task_status AS ENUM (
  'backlog',
  'ready',
  'blocked',
  'on_hold',
  'in_progress',
  'in_review',
  'needs_revision',
  'completed',
  'wont_do',
  'abandoned',
  'archived'
);

-- Create type for status history entries
CREATE TYPE status_history_entry AS (
  status text,
  changed_at timestamptz,
  changed_by text,
  reason text
);

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
  status feature_status NOT NULL DEFAULT 'planned',
  priority INTEGER NOT NULL DEFAULT 1,
  blocking_reason TEXT,
  blocked_by_id UUID REFERENCES features(id),
  status_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status_history JSONB NOT NULL DEFAULT '[]'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT features_no_self_blocking CHECK (id != blocked_by_id),
  CONSTRAINT features_blocking_requires_reason CHECK (
    (blocking_reason IS NULL AND blocked_by_id IS NULL) OR
    (blocking_reason IS NOT NULL AND blocked_by_id IS NOT NULL)
  )
);

-- Tasks table (third level - specific work items within a feature)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  status task_status NOT NULL DEFAULT 'backlog',
  priority INTEGER NOT NULL DEFAULT 1,
  blocking_reason TEXT,
  blocked_by_id UUID REFERENCES tasks(id),
  status_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status_history JSONB NOT NULL DEFAULT '[]'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT tasks_no_self_blocking CHECK (id != blocked_by_id),
  CONSTRAINT tasks_blocking_requires_reason CHECK (
    (blocking_reason IS NULL AND blocked_by_id IS NULL) OR
    (blocking_reason IS NOT NULL AND blocked_by_id IS NOT NULL)
  )
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
-- Functions and Triggers
-- =============================================

-- Create function to update status_updated_at and status_history automatically
CREATE OR REPLACE FUNCTION update_status_tracking()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if status has changed
  IF OLD.status != NEW.status THEN
    -- Update status_updated_at
    NEW.status_updated_at := now();
    
    -- Add entry to status_history
    NEW.status_history := jsonb_build_array(
      jsonb_build_object(
        'status', NEW.status,
        'changed_at', NEW.status_updated_at,
        'changed_by', current_user,
        'reason', COALESCE(NEW.blocking_reason, 'Status updated')
      )
    ) || OLD.status_history;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain status history
CREATE TRIGGER update_feature_status_tracking
  BEFORE UPDATE OF status ON features
  FOR EACH ROW
  EXECUTE FUNCTION update_status_tracking();

CREATE TRIGGER update_task_status_tracking
  BEFORE UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_status_tracking();

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
CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_features_blocked_by ON features(blocked_by_id) WHERE blocked_by_id IS NOT NULL;
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_blocked_by ON tasks(blocked_by_id) WHERE blocked_by_id IS NOT NULL;

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
-- RLS Policies
-- =============================================

-- Enable row level security
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON features
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON features
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON features
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================
-- Documentation - Table and Column Comments
-- =============================================

-- Types comments
COMMENT ON TYPE feature_status IS 'Valid status values for features in the TaskFlow system';
COMMENT ON TYPE task_status IS 'Valid status values for tasks in the TaskFlow system';
COMMENT ON TYPE status_history_entry IS 'Structure for status history entries tracking status changes';

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

-- Feature and task status columns
COMMENT ON COLUMN features.status IS 'Current status of the feature';
COMMENT ON COLUMN features.blocking_reason IS 'Reason why the feature is blocked (if status is blocked)';
COMMENT ON COLUMN features.blocked_by_id IS 'ID of the feature blocking this one (if status is blocked)';
COMMENT ON COLUMN features.status_updated_at IS 'Timestamp of the last status update';
COMMENT ON COLUMN features.status_history IS 'History of all status changes with metadata';
COMMENT ON COLUMN features.metadata IS 'Additional flexible metadata for the feature';

COMMENT ON COLUMN tasks.status IS 'Current status of the task';
COMMENT ON COLUMN tasks.blocking_reason IS 'Reason why the task is blocked (if status is blocked)';
COMMENT ON COLUMN tasks.blocked_by_id IS 'ID of the task blocking this one (if status is blocked)';
COMMENT ON COLUMN tasks.status_updated_at IS 'Timestamp of the last status update';
COMMENT ON COLUMN tasks.status_history IS 'History of all status changes with metadata';
COMMENT ON COLUMN tasks.metadata IS 'Additional flexible metadata for the task';

-- Tracking tables
COMMENT ON TABLE snapshots IS 'Point-in-time content snapshots of modified files';
COMMENT ON COLUMN snapshots.content_hash IS 'Base64 encoded hash of content for comparison and deduplication';
COMMENT ON TABLE decisions IS 'Key decisions made during development sessions';

-- Extended feature tables
COMMENT ON TABLE feedback IS 'Tracks effectiveness of decisions and strategies for reuse';
COMMENT ON TABLE scope_validations IS 'Logs compliance checks and warnings about scope violations';
COMMENT ON TABLE task_requirements IS 'Detailed requirements for tasks to enable better validation';