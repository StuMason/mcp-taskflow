-- Create new feature status enum
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

-- Create new task status enum
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

-- Add new columns to features table
ALTER TABLE features
  -- Drop old status column
  DROP COLUMN status,
  -- Add new status column with new enum
  ADD COLUMN status feature_status NOT NULL DEFAULT 'planned',
  -- Add blocking metadata
  ADD COLUMN blocking_reason text,
  ADD COLUMN blocked_by_id uuid REFERENCES features(id),
  -- Add status tracking
  ADD COLUMN status_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN status_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Add flexible metadata
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Add constraints
  ADD CONSTRAINT features_no_self_blocking CHECK (id != blocked_by_id),
  ADD CONSTRAINT features_blocking_requires_reason CHECK (
    (blocking_reason IS NULL AND blocked_by_id IS NULL) OR
    (blocking_reason IS NOT NULL AND blocked_by_id IS NOT NULL)
  );

-- Add new columns to tasks table
ALTER TABLE tasks
  -- Drop old status column
  DROP COLUMN status,
  -- Add new status column with new enum
  ADD COLUMN status task_status NOT NULL DEFAULT 'backlog',
  -- Add blocking metadata
  ADD COLUMN blocking_reason text,
  ADD COLUMN blocked_by_id uuid REFERENCES tasks(id),
  -- Add status tracking
  ADD COLUMN status_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN status_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Add flexible metadata
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Add constraints
  ADD CONSTRAINT tasks_no_self_blocking CHECK (id != blocked_by_id),
  ADD CONSTRAINT tasks_blocking_requires_reason CHECK (
    (blocking_reason IS NULL AND blocked_by_id IS NULL) OR
    (blocking_reason IS NOT NULL AND blocked_by_id IS NOT NULL)
  );

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

-- Create indexes for common queries
CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_features_blocked_by ON features(blocked_by_id) WHERE blocked_by_id IS NOT NULL;
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_blocked_by ON tasks(blocked_by_id) WHERE blocked_by_id IS NOT NULL;

-- Add RLS policies for new columns
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

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

-- Comments for documentation
COMMENT ON TYPE feature_status IS 'Valid status values for features in the TaskFlow system';
COMMENT ON TYPE task_status IS 'Valid status values for tasks in the TaskFlow system';
COMMENT ON TYPE status_history_entry IS 'Structure for status history entries tracking status changes';
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