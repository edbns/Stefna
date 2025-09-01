-- Add Fal.ai models registry table for automated health management
CREATE TABLE IF NOT EXISTS fal_models (
  model_id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  mode TEXT NOT NULL, -- 'photo', 'ghibli', 'video'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'disabled', 'testing'
  priority INTEGER NOT NULL DEFAULT 1,
  cost TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  last_check TIMESTAMP DEFAULT NOW(),
  failure_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  auto_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert current models
INSERT INTO fal_models (model_id, model_name, mode, priority, cost, description) VALUES
-- Photo models
('fal-ai/hyper-sdxl/image-to-image', 'Hyper SDXL I2I', 'photo', 1, 'medium', 'High-quality photo-realistic image-to-image'),
('fal-ai/pixart-alpha', 'PixArt Alpha', 'photo', 2, 'medium', 'Reliable SDXL-style fallback'),
('fal-ai/realvis-xl-v3', 'RealVis XL V3', 'photo', 3, 'high', 'Another good photoreal fallback'),

-- Ghibli models
('fal-ai/hyper-sdxl/image-to-image', 'Hyper SDXL I2I', 'ghibli', 1, 'medium', 'High-quality image-to-image with subtle Ghibli elements'),
('fal-ai/pixart-alpha', 'PixArt Alpha', 'ghibli', 2, 'medium', 'Reliable SDXL-style with gentle Ghibli influence'),
('fal-ai/realvis-xl-v3', 'RealVis XL V3', 'ghibli', 3, 'high', 'Photoreal with soft Ghibli aesthetic'),

-- Video models
('fal-ai/fast-sdxl', 'Fast SDXL', 'video', 1, 'low', 'Fast video generation from images')
ON CONFLICT (model_id, mode) DO NOTHING;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_fal_models_mode_status ON fal_models(mode, status);
CREATE INDEX IF NOT EXISTS idx_fal_models_last_check ON fal_models(last_check);
