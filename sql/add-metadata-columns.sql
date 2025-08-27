-- Add metadata column to all dedicated media tables
-- This column is required by the application code for IPA results and generation tracking

-- Add metadata column to neo_glitch_media table
ALTER TABLE neo_glitch_media 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add metadata column to custom_prompt_media table  
ALTER TABLE custom_prompt_media 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add metadata column to emotion_mask_media table
ALTER TABLE emotion_mask_media 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add metadata column to ghibli_reaction_media table
ALTER TABLE ghibli_reaction_media 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add metadata column to presets_media table
ALTER TABLE presets_media 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Verify the columns were added
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN (
  'neo_glitch_media',
  'custom_prompt_media', 
  'emotion_mask_media',
  'ghibli_reaction_media',
  'presets_media'
)
AND column_name = 'metadata'
ORDER BY table_name;
