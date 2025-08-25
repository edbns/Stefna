export type GenerationMode = 'i2i' | 't2i' | 'story';

export interface GenerationMetadata {
  mode: GenerationMode;
  prompt?: string;
  negative_prompt?: string;
  strength?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  group?: 'story'|null;
}
