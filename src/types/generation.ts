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

export interface GenerateJob {
  id: string;
  userId: string;
  mode: GenerationMode;
  prompt?: string;
  negativePrompt?: string;
  strength?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  group?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  metadata?: GenerationMetadata;
}
