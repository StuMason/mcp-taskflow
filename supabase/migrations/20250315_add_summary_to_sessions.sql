-- Add summary column to sessions table
ALTER TABLE sessions ADD COLUMN summary TEXT;

-- Add comment for documentation
COMMENT ON COLUMN sessions.summary IS 'Summary of what was accomplished in the session'; 