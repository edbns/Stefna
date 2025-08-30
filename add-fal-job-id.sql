-- Add fal_job_id column to ghibli_reaction_media table
-- This replaces the old aiml_job_id for tracking fal.ai generation jobs

ALTER TABLE ghibli_reaction_media 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

-- Add comment for clarity
COMMENT ON COLUMN ghibli_reaction_media.fal_job_id IS 'Fal.ai generation job ID for tracking and debugging';

-- Update existing records to have NULL fal_job_id (they were using aiml_job_id)
UPDATE ghibli_reaction_media 
SET fal_job_id = NULL 
WHERE fal_job_id IS NULL;
