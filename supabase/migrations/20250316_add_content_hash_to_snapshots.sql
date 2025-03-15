-- Add content_hash column to snapshots table
ALTER TABLE snapshots ADD COLUMN content_hash TEXT;

-- Add comment for documentation
COMMENT ON COLUMN snapshots.content_hash IS 'Base64 encoded hash of content for comparison and deduplication'; 