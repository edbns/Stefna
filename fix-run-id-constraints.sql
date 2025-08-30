-- Fix run_id constraints to allow null values during job creation
-- The run_id is populated later when the AI generation starts

-- Neo glitch media table
ALTER TABLE neo_glitch_media ALTER COLUMN run_id DROP NOT NULL;

-- Presets media table  
ALTER TABLE presets_media ALTER COLUMN run_id DROP NOT NULL;

-- Emotion mask media table
ALTER TABLE emotion_mask_media ALTER COLUMN run_id DROP NOT NULL;

-- Ghibli reaction media table
ALTER TABLE ghibli_reaction_media ALTER COLUMN run_id DROP NOT NULL;

-- Custom prompt media table
ALTER TABLE custom_prompt_media ALTER COLUMN run_id DROP NOT NULL;

-- Add comments to explain the constraint change
COMMENT ON COLUMN neo_glitch_media.run_id IS 'AI generation run ID. Null when job is created, populated when generation starts.';
COMMENT ON COLUMN presets_media.run_id IS 'AI generation run ID. Null when job is created, populated when generation starts.';
COMMENT ON COLUMN emotion_mask_media.run_id IS 'AI generation run ID. Null when job is created, populated when generation starts.';
COMMENT ON COLUMN ghibli_reaction_media.run_id IS 'AI generation run ID. Null when job is created, populated when generation starts.';
COMMENT ON COLUMN custom_prompt_media.run_id IS 'AI generation run ID. Null when job is created, populated when generation starts.';

-- Verify the changes
SELECT 
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name IN (
  'neo_glitch_media',
  'presets_media', 
  'emotion_mask_media',
  'ghibli_reaction_media',
  'custom_prompt_media'
) 
AND column_name = 'run_id'
ORDER BY table_name;
