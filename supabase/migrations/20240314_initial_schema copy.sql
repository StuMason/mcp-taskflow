-- Create tables for MCP Taskflow

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  context_description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE
);

-- File changes table
CREATE TABLE file_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(id),
  file_path TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'modified', 'deleted')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Checkpoints table
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(id),
  progress TEXT NOT NULL,
  changes_description TEXT NOT NULL,
  current_thinking TEXT NOT NULL,
  next_steps TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_file_changes_session_id ON file_changes(session_id);
CREATE INDEX idx_file_changes_file_path ON file_changes(file_path);
CREATE INDEX idx_checkpoints_session_id ON checkpoints(session_id);

-- Add comments for documentation
COMMENT ON TABLE sessions IS 'Tracks assistant sessions';
COMMENT ON TABLE file_changes IS 'Records modifications to files';
COMMENT ON TABLE checkpoints IS 'Captures progress at specific points in time'; 