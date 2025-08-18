-- Add final_url column to assets table for storing generated media URLs
-- This allows assets to be updated with the final result after generation

ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS final_url text;

-- Add index for performance when querying by final_url
CREATE INDEX IF NOT EXISTS idx_assets_final_url ON public.assets(final_url) WHERE final_url IS NOT NULL;

-- Update existing assets that might have null final_url
UPDATE public.assets 
SET final_url = cloudinary_public_id 
WHERE final_url IS NULL AND cloudinary_public_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.assets.final_url IS 'URL of the final generated media (from AIML API or other generation service)';
