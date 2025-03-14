-- Enhanced TaskFlow Schema with Application, Feature, and Task Structure

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

-- Enhancing existing Sessions table to link to tasks
ALTER TABLE sessions ADD COLUMN task_id UUID REFERENCES tasks(id);
ALTER TABLE sessions ADD COLUMN application_id UUID REFERENCES applications(id);
ALTER TABLE sessions ADD COLUMN feature_id UUID REFERENCES features(id);

-- Add status field if it doesn't exist
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE sessions ADD CONSTRAINT valid_session_status CHECK (status IN ('active', 'completed', 'abandoned'));

-- Snapshots table (for content snapshots)
CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Decision Log table (for tracking key decisions)
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  alternatives TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_features_application_id ON features(application_id);
CREATE INDEX idx_tasks_feature_id ON tasks(feature_id);
CREATE INDEX idx_sessions_task_id ON sessions(task_id);
CREATE INDEX idx_sessions_application_id ON sessions(application_id);
CREATE INDEX idx_sessions_feature_id ON sessions(feature_id);
CREATE INDEX idx_snapshots_session_id ON snapshots(session_id);
CREATE INDEX idx_snapshots_file_path ON snapshots(file_path);
CREATE INDEX idx_decisions_session_id ON decisions(session_id);

-- Add comments for documentation
COMMENT ON TABLE applications IS 'Top-level software products being developed';
COMMENT ON TABLE features IS 'Major functionality groups within applications';
COMMENT ON TABLE tasks IS 'Specific work items within features';
COMMENT ON TABLE snapshots IS 'Point-in-time content snapshots of modified files';
COMMENT ON TABLE decisions IS 'Key decisions made during development sessions';