// Advanced Region-Aware Editing Presets
// Prevents identity drift through subject locking and per-region control
// Uses LOCK → RENDER → COMPOSE pipeline

import { EditPreset } from '../types/editing';

// ================================================================
// 1. Neo-Glitch (crazy colors/transformations - background only)
// ================================================================

export const NEO_GLITCH_CRAZY: EditPreset = {
  id: 'neo_glitch_crazy',
  name: 'Neo Glitch Crazy',
  tag: 'Cyber',
  prompt:
    'create a neon cyberpunk glitch field behind the subject: intense RGB split, pixel sorting streaks, holographic HUD frames, VHS scanlines, chromatic aberration, datamosh blocks, refractive glass shards, volumetric glow, neon magenta/cyan/amber palette; keep the person fully photorealistic and unaltered; do not redraw or stylize the face or body; background only',
  strength: 0.6, // not used directly; we drive per-layer below
  description: 'Explosive neon glitch background with locked subject',
  category: 'vibrant',
  subject_lock: { enabled: true, weight: 0.82 }, // set ref at runtime
  control: [
    { type: 'ip_face',  weight: 0.82 },          // subject identity
    { type: 'lineart',  weight: 0.45 },          // contour anchor
    { type: 'depth',    weight: 0.35 }           // separation
  ],
  applies: [
    { key: 'subject',    denoise: 0.18, blend: 'normal' },   // preserve face/body
    { key: 'background', denoise: 0.72, blend: 'screen' }    // go wild, additive feel
  ]
};

// ================================================================
// 2. Ghibli (background-only, subject preserved)
// ================================================================

export const GHIBLI_LAYERED: EditPreset = {
  id: 'ghibli_layered',
  name: 'Ghibli Layer (BG only)',
  tag: 'Ghibli',
  prompt:
    'hand-painted studio ghibli style background with soft brushwork, warm light, painterly foliage and bokeh; keep the person entirely realistic and untouched; do not stylize the subject',
  strength: 0.5,
  description: 'Ghibli background pass, photoreal subject',
  category: 'cinematic',
  subject_lock: { enabled: true, weight: 0.80 },
  control: [
    { type: 'ip_face', weight: 0.80 },
    { type: 'depth',   weight: 0.40 }
  ],
  applies: [
    { key: 'subject',    denoise: 0.15, blend: 'normal' },
    { key: 'background', denoise: 0.62, blend: 'soft-light' }
  ]
};

// ================================================================
// 3. Emotion Mask (micro-expression only)
// ================================================================

export const EMOTION_MASK_SMILE: EditPreset = {
  id: 'emotion_mask_slight_smile',
  name: 'Emotion Mask – Slight Smile',
  tag: 'Portrait',
  prompt:
    'subtle positive micro-expression: gentle mouth corner lift, relaxed eyes, soft cheek highlight; maintain the exact facial geometry and identity; apply only to mouth and cheeks',
  strength: 0.3,
  description: 'Micro-expression inpainting on mouth/cheeks only',
  category: 'minimal',
  subject_lock: { enabled: true, weight: 0.85 },
  control: [
    { type: 'ip_face', weight: 0.85 },
    { type: 'pose',    weight: 0.35 }           // optional
  ],
  applies: [
    { key: 'mouth',  denoise: 0.24, blend: 'normal' },
    { key: 'cheeks', denoise: 0.22, blend: 'soft-light' },
    { key: 'eyes',   denoise: 0.18, blend: 'normal' } // optional sparkle
  ]
};

export const EMOTION_MASK_SERENE: EditPreset = {
  id: 'emotion_mask_serene',
  name: 'Emotion Mask – Serene',
  tag: 'Portrait',
  prompt:
    'peaceful, serene expression: soft, relaxed features, gentle eye expression, calm mouth; maintain exact facial geometry and identity; apply only to eyes and mouth area',
  strength: 0.28,
  description: 'Serene micro-expression inpainting',
  category: 'minimal',
  subject_lock: { enabled: true, weight: 0.85 },
  control: [
    { type: 'ip_face', weight: 0.85 },
    { type: 'pose',    weight: 0.35 }
  ],
  applies: [
    { key: 'eyes',   denoise: 0.20, blend: 'normal' },
    { key: 'mouth',  denoise: 0.22, blend: 'normal' },
    { key: 'cheeks', denoise: 0.18, blend: 'soft-light' }
  ]
};

export const EMOTION_MASK_FIERCE: EditPreset = {
  id: 'emotion_mask_fierce',
  name: 'Emotion Mask – Fierce',
  tag: 'Portrait',
  prompt:
    'determined, fierce expression: slightly narrowed eyes, set jaw, focused gaze; maintain exact facial geometry and identity; apply only to eyes and jaw area',
  strength: 0.32,
  description: 'Fierce micro-expression inpainting',
  category: 'minimal',
  subject_lock: { enabled: true, weight: 0.85 },
  control: [
    { type: 'ip_face', weight: 0.85 },
    { type: 'pose',    weight: 0.40 }
  ],
  applies: [
    { key: 'eyes', denoise: 0.24, blend: 'normal' },
    { key: 'mouth', denoise: 0.26, blend: 'normal' },
    { key: 'cheeks', denoise: 0.20, blend: 'soft-light' }
  ]
};

// ================================================================
// 4. Advanced Neo Tokyo (with subject locking)
// ================================================================

export const NEO_TOKYO_ADVANCED: EditPreset = {
  id: 'neo_tokyo_advanced',
  name: 'Neo Tokyo Advanced',
  tag: 'Cyber',
  prompt:
    'cyberpunk neon aesthetic: add neon rim lighting around hair edges, subtle HUD elements in background, neon bokeh; keep face completely photorealistic; no lines over skin',
  strength: 0.45,
  description: 'Advanced Neo Tokyo with subject preservation',
  category: 'vibrant',
  subject_lock: { enabled: true, weight: 0.80 },
  control: [
    { type: 'ip_face', weight: 0.80 },
    { type: 'depth',   weight: 0.35 }
  ],
  applies: [
    { key: 'subject',    denoise: 0.16, blend: 'normal' },
    { key: 'background', denoise: 0.58, blend: 'screen' },
    { key: 'hair',       denoise: 0.24, blend: 'overlay' }
  ]
};

// ================================================================
// Export all advanced presets
// ================================================================

export const ADVANCED_EDITING_PRESETS: EditPreset[] = [
  NEO_GLITCH_CRAZY,
  GHIBLI_LAYERED,
  EMOTION_MASK_SMILE,
  EMOTION_MASK_SERENE,
  EMOTION_MASK_FIERCE,
  NEO_TOKYO_ADVANCED
];

export function getAdvancedEditingPreset(presetId: string): EditPreset | undefined {
  return ADVANCED_EDITING_PRESETS.find((p) => p.id === presetId);
}

export function isAdvancedEditingPreset(presetId: string): boolean {
  return ADVANCED_EDITING_PRESETS.some((p) => p.id === presetId);
}
