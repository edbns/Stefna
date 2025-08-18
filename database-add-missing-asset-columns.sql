-- Add missing columns to assets table for update-asset-result function
-- This migration adds all the columns that the function is trying to update

-- Add final_url column (if not already added)
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS final_url text;

-- Add meta column for storing additional metadata
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS meta jsonb;

-- Add prompt column for storing the generation prompt
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS prompt text;

-- Add status column for tracking asset state
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'queued';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_final_url ON public.assets(final_url) WHERE final_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_meta ON public.assets USING GIN (meta) WHERE meta IS NOT NULL;

-- Update existing records with default values
UPDATE public.assets 
SET 
  final_url = COALESCE(final_url, cloudinary_public_id),
  status = COALESCE(status, 'queued'),
  meta = COALESCE(meta, '{}'::jsonb)
WHERE final_url IS NULL OR status IS NULL OR meta IS NULL;

-- Add comments
COMMENT ON COLUMN public.assets.final_url IS 'URL of the final generated media (from AIML API or other generation service)';
COMMENT ON COLUMN public.assets.meta IS 'Additional metadata about the asset (mode, presetId, runId, etc.)';
COMMENT ON COLUMN public.assets.prompt IS 'The prompt used to generate this asset';
COMMENT ON COLUMN public.assets.status IS 'Current status of the asset (queued, processing, ready, failed)';

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
AND table_schema = 'public'
ORDER BY ordinal_position;
