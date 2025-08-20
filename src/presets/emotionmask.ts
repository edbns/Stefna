// src/presets/emotionMask.ts

export type EmotionMaskPreset = {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
  strength: number;
  model: string; // Best available AIML models
};

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
  {
    id: 'none',
    label: 'None',
    prompt: '',
    negative_prompt: '',
    strength: 0.0,
    model: 'flux/dev/image-to-image', // Default AIML model
  },
  {
    id: 'joy_sadness',
    label: 'Joy + Sadness',
    prompt: "Outer smile with inner sadness in the eyes. Show the mask of happiness hiding true sorrow. Preserve exact facial identity.",
    negative_prompt: "cartoon, anime, distorted face, different person, skin change",
    strength: 0.15, // More subtle for better identity preservation
    model: 'realistic-vision', // Best for facial detail and identity preservation
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt: "Confident exterior with hidden vulnerability in the eyes. Show the warrior who carries hidden wounds. Preserve exact facial identity.",
    negative_prompt: "cartoon, anime, distorted face, different person, skin change",
    strength: 0.15, // More subtle for better identity preservation
    model: 'realistic-vision', // Best for facial detail and identity preservation
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: "Warm memories in the eyes but emotional distance in expression. Show longing for what's lost. Preserve exact facial identity.",
    negative_prompt: "cartoon, anime, distorted face, different person, skin change",
    strength: 0.15, // More subtle for better identity preservation
    model: 'realistic-vision', // Best for facial detail and identity preservation
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt: "Calm exterior with subtle fear in the eyes. Show the peace that masks inner anxiety. Preserve exact facial identity.",
    negative_prompt: "cartoon, anime, distorted face, different person, skin change",
    strength: 0.15, // More subtle for better identity preservation
    model: 'realistic-vision', // Best for facial detail and identity preservation
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt: "Strong, confident pose with hidden loneliness in the eyes. Show the leader who feels alone. Preserve exact facial identity.",
    negative_prompt: "cartoon, anime, distorted face, different person, skin change",
    strength: 0.15, // More subtle for better identity preservation
    model: 'realistic-vision', // Best for facial detail and identity preservation
  },
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  // Handle the special 'none' case and check if it's a valid emotion mask preset
  if (presetId === 'none') return true;
  return EMOTION_MASK_PRESETS.some(p => p.id === presetId);
}
