// @ts-nocheck
import axios from "axios";
import FormData from "form-data";

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
