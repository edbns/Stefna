// Optimized inference parameters for razor-sharp I2I results

export interface SharpInferenceParams {
  strength: number;
  cfg_scale: number;
  sampler?: string;
  steps?: number;
  seed_behavior?: string;
}

export function paramsForI2ISharp(): SharpInferenceParams {
  return {
    // Lower = preserves structure/identity; 0.22–0.35 is the sweet spot
    strength: 0.28,
    // Higher = adheres more to prompt details; 6–8 gives crisp edges without posterizing
    cfg_scale: 7.2,
    // Optional if your backend supports it:
    sampler: "dpmpp_2m_sde",      // or your sharpest available sampler
    steps: 32,                     // modest steps, good returns
    seed_behavior: "lock_if_set",  // repeatability when debugging
  };
}

// For portraits that need gentler treatment
export function paramsForPortraitSharp(): SharpInferenceParams {
  return {
    strength: 0.32,  // Slightly higher for portraits
    cfg_scale: 6.8,  // Slightly lower to avoid over-processing skin
    sampler: "dpmpp_2m_sde",
    steps: 32,
    seed_behavior: "lock_if_set",
  };
}

// For maximum sharpness on landscapes/objects
export function paramsForMaxSharp(): SharpInferenceParams {
  return {
    strength: 0.25,  // Lower for maximum structure preservation
    cfg_scale: 7.5,  // Higher for maximum prompt adherence
    sampler: "dpmpp_2m_sde",
    steps: 36,       // More steps for fine details
    seed_behavior: "lock_if_set",
  };
}
