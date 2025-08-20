// src/presets/emotionMask.ts
export type EmotionMaskPreset = {
  id: string
  label: string
  prompt: string
}

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
  {
    id: 'em_none',
    label: 'None',
    prompt: '',
  },
  {
    id: 'em_joy_sadness',
    label: 'Joy + Sadness',
    prompt: "Subtly enhance expression to reflect joy mixed with sadness. Preserve ethnicity, skin tone, and all facial features. Only modify micro-expressions: eyes, eyebrows, and mouth. Output must look like the original person under different lighting or mood. No artistic filter.",
  },
  {
    id: 'em_strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt: "Enhance expression to show strength and vulnerability. Maintain full facial identity and ethnic features. Only modify emotional cues (gaze, mouth tension, subtle eyebrow lift). Avoid any stylization or skin alteration.",
  },
  {
    id: 'em_nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: "Enhance the image to reflect nostalgia mixed with emotional distance. Preserve identity, race, and facial shape exactly. Subtle changes to eyes and mouth only. No dramatic visual style or cartoon effect. Natural lighting preferred.",
  },
  {
    id: 'em_peace_fear',
    label: 'Peace + Fear',
    prompt: "Adjust expression to blend peace and hidden fear. Identity, skin tone, and facial geometry must remain identical. Small tension in mouth or eyes allowed. No stylistic filter or skin smoothing.",
  },
  {
    id: 'em_confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt: "Create an expression of inner confidence mixed with loneliness. Only adjust emotional markers. Do not alter skin tone, facial structure, hair, or style. The person should still look exactly like themselves.",
  }
]

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId)
}

export function isEmotionMaskPreset(presetId: string) {
  return presetId.startsWith('em_')
}
