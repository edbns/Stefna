// src/presets/emotionmask.ts
export type EmotionMaskPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  vibe: string;
  meta: {
    source: string;
    variant: string;
  };
};

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
  {
    id: "joy_sadness",
    label: "Joy + Sadness",
    description: "I'm smiling but I'm sad inside",
    prompt: "edit the image to show a bittersweet expression — smiling with teary eyes, keep the face sharp, apply warm soft light on one side and cool blue shadows on the other, cinematic background blur, retain subject identity",
    vibe: "I'm smiling, but I'm breaking inside.",
    meta: {
      source: "emotion_mask",
      variant: "joy_sadness"
    }
  },
  {
    id: "strength_vulnerability",
    label: "Strength + Vulnerability", 
    description: "I look composed but I'm holding it together",
    prompt: "edit the image to reflect inner strength and subtle vulnerability, apply confident golden light from one side and soft blue-gray shadow on the other, keep eye contact strong, realistic skin texture, slight emotional tension in pose",
    vibe: "I look composed, but I'm holding it together.",
    meta: {
      source: "emotion_mask",
      variant: "strength_vulnerability"
    }
  },
  {
    id: "nostalgia_distance",
    label: "Nostalgia + Distance",
    description: "I'm remembering but it's already far away", 
    prompt: "transform the image with a nostalgic tone — faded warm backlight, cool desaturated face lighting, apply misty cinematic blur in background, keep expression soft and reflective, maintain identity and emotion",
    vibe: "I'm remembering, but it's already far away.",
    meta: {
      source: "emotion_mask",
      variant: "nostalgia_distance"
    }
  },
  {
    id: "peace_fear",
    label: "Peace + Fear",
    description: "I appear calm but I'm scared inside",
    prompt: "edit to express calm with underlying fear, soft warm top light above the face, cool shadows under eyes and jaw, foggy or abstract background blur, keep the expression serene but eyes slightly tense, preserve full identity",
    vibe: "I appear calm, but I'm scared inside.",
    meta: {
      source: "emotion_mask",
      variant: "peace_fear"
    }
  },
  {
    id: "confidence_loneliness",
    label: "Confidence + Loneliness",
    description: "I look strong but I feel alone",
    prompt: "modify the image to blend confident presence with subtle isolation, light one side with bold amber tone, fade the other into a low-saturation blur, retain direct gaze and clean skin texture, create a sense of quiet distance",
    vibe: "I look strong, but I feel alone.",
    meta: {
      source: "emotion_mask",
      variant: "confidence_loneliness"
    }
  }
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  return presetId.startsWith('em_');
}
