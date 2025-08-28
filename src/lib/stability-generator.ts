// @ts-nocheck
import axios from "axios";
import FormData from "form-data";

// ============================================================================
// STABILITY.AI MODULAR GENERATOR
// ============================================================================
// This module provides a clean, reusable interface for Stability.ai image generation
// with automatic fallback from Ultra → Core → SD3 tiers.
//
// USAGE EXAMPLES:
//
// 1. NeoGlitch Preset:
//    import { generateImageWithStability } from './stability-generator';
//    const result = await generateImageWithStability({ prompt, sourceUrl, ... });
//
// 2. Emotion Mask Preset:
//    const result = await generateImageWithStability({ 
//      prompt: "Emotional portrait with dramatic lighting...", 
//      sourceUrl, 
//      modelTier: "core" 
//    });
//
// 3. Studio Ghibli Preset:
//    const result = await generateImageWithStability({ 
//      prompt: "Studio Ghibli style animation...", 
//      sourceUrl, 
//      modelTier: "ultra" 
//    });
// ============================================================================

// Check Stability.ai account status and remaining credits
export async function checkStabilityAccount(stabilityApiKey: string) {
  try {
    const response = await axios.get('https://api.stability.ai/v1/user/account', {
      headers: {
        'Authorization': `Bearer ${stabilityApiKey}`,
        'Accept': 'application/json'
      },
      timeout: 10_000
    });

    const account = response.data;
    console.log('💰 [Stability.ai] Account Status:', {
      email: account.email,
      tier: account.tier,
      remainingCredits: account.remaining_credits,
      totalCredits: account.total_credits,
      usagePercentage: account.usage_percentage
    });

    return account;
  } catch (error: any) {
    console.warn('⚠️ [Stability.ai] Failed to check account status:', error.message);
    return null;
  }
}

// Drop-in Stability.ai generator with 3-tier fallback: Ultra → Core → SD3
export async function generateImageWithStability({
  prompt,
  sourceUrl,
  modelTier = "ultra",
  strength = 0.7,
  steps = 35,
  cfgScale = 8.5,
  stabilityApiKey
}: {
  prompt: string;
  sourceUrl: string;
  modelTier?: "ultra" | "core" | "sd3";
  strength?: number;
  steps?: number;
  cfgScale?: number;
  stabilityApiKey: string;
}) {
  const MODEL_ENDPOINTS = {
    ultra: "https://api.stability.ai/v2beta/stable-image/generate/ultra",
    core: "https://api.stability.ai/v2beta/stable-image/generate/core",
    sd3: "https://api.stability.ai/v2beta/stable-image/generate/sd3",
  };

  const tiers = ["ultra", "core", "sd3"];
  const startIndex = tiers.indexOf(modelTier);
  const fallbackTiers = tiers.slice(startIndex);

  let lastError = null;

  // Fetch source image buffer once
  let imageBuffer: Buffer;
  try {
    const imageResp = await axios.get(sourceUrl, { responseType: "arraybuffer" });
    imageBuffer = Buffer.from(imageResp.data);
    console.log(`🖼️ [Stability.ai] Downloaded source image: ${imageBuffer.length} bytes`);
  } catch (err) {
    throw new Error("❌ Failed to fetch source image for Stability.ai: " + err.message);
  }

  for (const tier of fallbackTiers) {
    const endpoint = MODEL_ENDPOINTS[tier];
    console.log(`🧪 [Stability.ai] Trying ${tier.toUpperCase()}...`);

    const form = new FormData();
    form.append("prompt", prompt);
    form.append("init_image", imageBuffer, { filename: "input.png" });
    form.append("image_strength", strength.toString());
    form.append("steps", steps.toString());
    form.append("cfg_scale", cfgScale.toString());
    form.append("samples", "1");

    try {
      console.log(`📤 [Stability.ai] Sending request to ${tier.toUpperCase()} with FormData`);
      const response = await axios.post(endpoint, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${stabilityApiKey}`,
        },
        maxBodyLength: Infinity,
        timeout: 30_000,
      });

      // If successful, return the image and model info
      const { artifacts } = response.data;
      const resultImageUrl = artifacts?.[0]?.url;
      if (!resultImageUrl) throw new Error("⚠️ No image returned");

      console.log(`✅ [Stability.ai] Success with ${tier.toUpperCase()}`);
      return {
        url: resultImageUrl,
        tier,
        model: tier,
        raw: response.data,
      };
    } catch (err) {
      lastError = err;
      console.warn(`❌ [Stability.ai] ${tier.toUpperCase()} failed: ${err.response?.data?.errors || err.message}`);
    }
  }

  // All attempts failed
  throw new Error("❌ Stability.ai failed on all tiers: " + (lastError?.message || "unknown error"));
}
