-- Update RLS policies to allow write operations for all users in development

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON features;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON features;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON tasks;

-- Create new permissive policies
CREATE POLICY "Enable insert for all users" ON features
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON features
  FOR UPDATE USING (true);

CREATE POLICY "Enable update for all users" ON tasks
  FOR UPDATE USING (true);

-- Add RLS policies for other tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables
CREATE POLICY "Enable all operations for all users" ON sessions FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON file_changes FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON checkpoints FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON decisions FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON snapshots FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON applications FOR ALL USING (true); 