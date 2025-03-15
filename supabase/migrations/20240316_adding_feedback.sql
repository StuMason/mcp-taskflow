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

-- Add timestamp tracking for file operations to better enforce workflow
ALTER TABLE sessions ADD COLUMN last_checkpoint_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN last_file_change_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN last_decision_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN compliance_score INTEGER DEFAULT 100;

-- Add indexes for better query performance
CREATE INDEX idx_feedback_session_id ON feedback(session_id);
CREATE INDEX idx_feedback_decision_id ON feedback(decision_id);
CREATE INDEX idx_feedback_applicable_task_types ON feedback USING GIN(applicable_task_types);
CREATE INDEX idx_feedback_tags ON feedback USING GIN(tags);
CREATE INDEX idx_scope_validations_session_id ON scope_validations(session_id);
CREATE INDEX idx_task_requirements_task_id ON task_requirements(task_id);

-- Add comments for documentation
COMMENT ON TABLE feedback IS 'Tracks effectiveness of decisions and strategies for reuse';
COMMENT ON TABLE scope_validations IS 'Logs compliance checks and warnings about scope violations';
COMMENT ON TABLE task_requirements IS 'Detailed requirements for tasks to enable better validation';
COMMENT ON COLUMN sessions.compliance_score IS 'Score from 0-100 indicating adherence to workflow protocols';