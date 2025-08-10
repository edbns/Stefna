export const HARD_LIMITS = {
  // Images: MVP-friendly caps (approx 2048px max side, ~4.2 MP)
  MAX_IMG_W: 2048,
  MAX_IMG_H: 2048,
  MAX_IMG_MP: 4.2,

  // Video: MVP caps (720p, 30s, 30fps)
  MAX_VID_W: 1280,
  MAX_VID_H: 720,
  MAX_VID_FPS: 30,
  MAX_VID_SECONDS: 30
};

export const DEFAULTS = {
  I2I_STRENGTH: 0.45,
  V2V_STRENGTH: 0.50,
  GUIDANCE: 7.5,
  STEPS: 40
};

// Strength clamping per preset type
const clampStrength = (strength: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, strength));
};

// Style-only presets (no new subjects) + negatives to prevent frames/props.
export const PRESETS: Record<string, {prompt:string; negative:string; strength?:number}> = {
  "Oil Painting": {
    prompt: "oil painting style, thick brush strokes, canvas texture, preserve subject and composition, keep same person and pose, do not change age or gender",
    negative: "frame, border, gallery wall, flowers, vase, watermark, text, logo, polaroid, photo frame, vignette, black and white, different person, child, baby, boy, girl, face swap, age change"
  },
  "Cyberpunk": {
    prompt: "neon lighting, high-contrast cyberpunk color grading, chrome highlights, retain original subject, keep same person and pose, do not change age or gender",
    negative: "monochrome, grayscale, frame, border, vignette, polaroid, text, caption, watermark, different person, child, baby, boy, girl, face swap, age change",
    strength: 0.75
  },
  "Studio Ghibli": {
    prompt: "ghibli-inspired soft shading, gentle color palette, clean lines, keep same subject and pose, do not change age or gender",
    negative: "photorealistic, realistic skin, film grain, camera, lens, watermark, frame, border, text, caption, vignette, different person, child, baby, boy, girl, face swap, age change",
    strength: clampStrength(0.9, 0.85, 0.95) // Clamped: 0.85-0.95 for anime/ghibli
  },
  "Photorealistic": {
    prompt: "highly detailed photographic style, natural texture, realistic lighting, keep original composition", 
    negative: "painting, illustration, frame, border, oversharpened, watermark, cartoon, anime, polaroid, film frame, vignette",
    strength: clampStrength(0.55, 0.45, 0.65) // Clamped: 0.45-0.65 for photo
  },
  "Watercolor": {
    prompt: "watercolor painting style, soft washes, paper texture, preserve subject and composition",
    negative: "frame, border, gallery wall, extra objects, text, watermark, digital artifacts, polaroid, photo frame, vignette"
  },
  "Anime Dream": {
    prompt: "anime style, clean outlines, vibrant shading, maintain original subject and pose, do not change age or gender",
    negative: "photorealistic, realistic, film grain, camera, lens, watermark, frame, border, text, caption, vignette, subtitles, logo, realistic photography, polaroid, photo frame, black and white, different person, child, baby, boy, girl, face swap, age change",
    strength: clampStrength(0.9, 0.85, 0.95) // Clamped: 0.85-0.95 for anime/ghibli
  },
  "Test Transform": {
    prompt: "convert to black and white, strong contrast, dramatic lighting",
    negative: "frame, border, vignette, watermark, text, color, colorful"
  },
  "Custom Transform": {
    prompt: "transform image style while keeping same subject and pose, do not change age or gender",
    negative: "photorealistic, realistic skin, film grain, frame, border, watermark, text, caption, different person, child, baby, boy, girl, face swap, age change",
    strength: 0.85
  }
};
