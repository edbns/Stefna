-- Add 3D model columns to media tables
-- This supports 3D generation alongside 2D generation

-- Add 3D columns to unreal_reflection_media table
ALTER TABLE unreal_reflection_media 
ADD COLUMN IF NOT EXISTS obj_url TEXT,
ADD COLUMN IF NOT EXISTS gltf_url TEXT,
ADD COLUMN IF NOT EXISTS texture_url TEXT,
ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB;

-- Add 3D columns to other media tables for future use
ALTER TABLE presets_media 
ADD COLUMN IF NOT EXISTS obj_url TEXT,
ADD COLUMN IF NOT EXISTS gltf_url TEXT,
ADD COLUMN IF NOT EXISTS texture_url TEXT,
ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB;

ALTER TABLE custom_prompt_media 
ADD COLUMN IF NOT EXISTS obj_url TEXT,
ADD COLUMN IF NOT EXISTS gltf_url TEXT,
ADD COLUMN IF NOT EXISTS texture_url TEXT,
ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB;

ALTER TABLE ghibli_reaction_media 
ADD COLUMN IF NOT EXISTS obj_url TEXT,
ADD COLUMN IF NOT EXISTS gltf_url TEXT,
ADD COLUMN IF NOT EXISTS texture_url TEXT,
ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB;

ALTER TABLE cyber_siren_media 
ADD COLUMN IF NOT EXISTS obj_url TEXT,
ADD COLUMN IF NOT EXISTS gltf_url TEXT,
ADD COLUMN IF NOT EXISTS texture_url TEXT,
ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB;

ALTER TABLE edit_media 
ADD COLUMN IF NOT EXISTS obj_url TEXT,
ADD COLUMN IF NOT EXISTS gltf_url TEXT,
ADD COLUMN IF NOT EXISTS texture_url TEXT,
ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB;

-- Add 3D columns to story/video tables for consistency
ALTER TABLE story 
ADD COLUMN IF NOT EXISTS obj_url TEXT,
ADD COLUMN IF NOT EXISTS gltf_url TEXT,
ADD COLUMN IF NOT EXISTS texture_url TEXT,
ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB;

ALTER TABLE story_photo 
ADD COLUMN IF NOT EXISTS obj_url TEXT,
ADD COLUMN IF NOT EXISTS gltf_url TEXT,
ADD COLUMN IF NOT EXISTS texture_url TEXT,
ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB;

ALTER TABLE video_jobs 
ADD COLUMN IF NOT EXISTS obj_url TEXT,
ADD COLUMN IF NOT EXISTS gltf_url TEXT,
ADD COLUMN IF NOT EXISTS texture_url TEXT,
ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB;

-- Create indexes for 3D file lookups
CREATE INDEX IF NOT EXISTS idx_unreal_reflection_media_3d ON unreal_reflection_media(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_presets_media_3d ON presets_media(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_3d ON custom_prompt_media(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ghibli_reaction_media_3d ON ghibli_reaction_media(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cyber_siren_media_3d ON cyber_siren_media(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_edit_media_3d ON edit_media(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_story_3d ON story(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_story_photo_3d ON story_photo(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_jobs_3d ON video_jobs(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;

-- Verify the changes
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('unreal_reflection_media', 'presets_media', 'custom_prompt_media', 'ghibli_reaction_media', 'cyber_siren_media', 'edit_media', 'story', 'story_photo', 'video_jobs')
AND column_name IN ('obj_url', 'gltf_url', 'texture_url', 'model_3d_metadata')
ORDER BY table_name, column_name;
