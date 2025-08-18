-- Simple fix for assets table - add only the essential missing columns
-- This is a minimal migration to get the update-asset-result function working

-- Add final_url column
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS final_url text;

-- Add meta column (JSONB for storing metadata)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS meta jsonb;

-- Add prompt column
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS prompt text;

-- Add status column with default
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS status text DEFAULT 'queued';

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
AND table_schema = 'public'
AND column_name IN ('final_url', 'meta', 'prompt', 'status')
ORDER BY column_name;
