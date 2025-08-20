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
    prompt: "Keep the exact same face, only modify expression to show outer smile with inner sadness in the eyes, preserve identity 100%, same person, same features, minimal change",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, realistic, photorealistic, dramatic effect",
    strength: 0.01, // Much more subtle for better identity preservation
    model: 'realistic-vision', // Best for facial detail and identity preservation
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt: "Keep the exact same face, only modify expression to show confident exterior with hidden vulnerability in the eyes, preserve identity 100%, same person, same features, minimal change",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, realistic, photorealistic, dramatic effect",
    strength: 0.01, // Much more subtle for better identity preservation
    model: 'realistic-vision', // Best for facial detail and identity preservation
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: "Keep the exact same face, only modify expression to show warm memories in the eyes but emotional distance, preserve identity 100%, same person, same features, minimal change",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, realistic, photorealistic, dramatic effect",
    strength: 0.01, // Much more subtle for better identity preservation
    model: 'realistic-vision', // Best for facial detail and identity preservation
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt: "Keep the exact same face, only modify expression to show calm exterior with subtle fear in the eyes, preserve identity 100%, same person, same features, minimal change",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, realistic, photorealistic, dramatic effect",
    strength: 0.01, // Much more subtle for better identity preservation
    model: 'realistic-vision', // Best for facial detail and identity preservation
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt: "Keep the exact same face, only modify expression to show strong confident pose with hidden loneliness in the eyes, preserve identity 100%, same person, same features, minimal change",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, realistic, photorealistic, dramatic effect",
    strength: 0.01, // Much more subtle for better identity preservation
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
