import { getAuthHeaders, signedFetch } from './auth.js';

export async function uploadToCloudinary(file, opts = {}) {
  const resource_type = file.type.startsWith("video") ? "video" : "image";
  
  // Get authenticated headers - this will throw if auth fails
  const headers = getAuthHeaders(opts);

  // 1) get a short-lived signature from our JWT-secured function
  const signRes = await signedFetch("/.netlify/functions/cloudinary-sign", {
    method: "POST",
    body: JSON.stringify({ resource_type, public_id: opts.public_id }),
  });
  if (!signRes.ok) {
    const errorData = await signRes.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to get signature");
  }
  const sign = await signRes.json();

  // 2) upload straight to Cloudinary (keeps payload tiny → no 413)
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.api_key);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);
  if (opts.public_id) form.append("public_id", opts.public_id);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resource_type}/upload`;
  const up = await fetch(uploadUrl, { method: "POST", body: form });
  const json = await up.json();
  if (!up.ok) throw new Error(json?.error?.message || "Cloudinary upload failed");

  const asset = {
    resource_type,
    url: json.secure_url,
    public_id: json.public_id,
    width: json.width,
    height: json.height,
    bytes: json.bytes,
    duration: json.duration,
    folder: sign.folder
  };

  // 3) Record asset in database
  try {
    const recordRes = await signedFetch("/.netlify/functions/record-asset", {
      method: "POST",
      body: JSON.stringify({
        ...asset,
        meta: {
          original_filename: file.name,
          file_size: file.size,
          upload_timestamp: new Date().toISOString()
        }
      })
    });
    
    if (recordRes.ok) {
      const { id } = await recordRes.json();
      asset.id = id;
      console.log(`✅ Asset recorded in DB with ID: ${id}`);
    } else {
      console.warn("⚠️ Failed to record asset in DB, but upload succeeded");
    }
  } catch (error) {
    console.warn("⚠️ Failed to record asset in DB:", error.message);
  }

  return asset;
}

// List user's assets from database
export async function listUserAssets(opts = {}) {
  const limit = opts.limit || 30;
  const res = await signedFetch(`/.netlify/functions/list-assets?limit=${limit}`, {
    method: "GET"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to list assets");
  }

  const { items } = await res.json();
  return items;
}

// Delete a single asset (from both Cloudinary and DB)
export async function deleteAsset(assetId, opts = {}) {
  const res = await signedFetch("/.netlify/functions/delete-upload", {
    method: "POST",
    body: JSON.stringify({ id: assetId })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete asset");
  }

  return await res.json();
}

// Purge all user assets (for account deletion)
export async function purgeUserAssets(opts = {}) {
  const res = await signedFetch("/.netlify/functions/purge-user", {
    method: "POST"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to purge user assets");
  }

  return await res.json();
}

// High-res IMAGE-TO-IMAGE with preset support
export async function runPresetI2I(asset, presetName, opts = {}) {
  const headers = getAuthHeaders(opts);

  // Import dynamically to avoid bundling issues
  const { HARD_LIMITS, PRESETS, DEFAULTS } = await import('../config/freeMode');
  const { clampImageToHardMax } = await import('./size');
  
  const preset = PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }
  
  // Clamp to hard limits only if over caps (keeps original res when possible)
  const { w, h } = clampImageToHardMax(
    { w: asset.width, h: asset.height },
    { 
      maxW: HARD_LIMITS.MAX_IMG_W, 
      maxH: HARD_LIMITS.MAX_IMG_H, 
      maxMP: HARD_LIMITS.MAX_IMG_MP 
    }
  );
  
  // 🆕 [New System] All generation now goes through dedicated functions
  console.log('🆕 [New System] Generation handled by dedicated functions - no old aimlApi needed');
  throw new Error('Direct aimlApi calls are deprecated - use dedicated generation functions');
}

// Legacy I2I function for backward compatibility
export async function runI2I(file, prompt, opts = {}) {
  const asset = await uploadToCloudinary(file, { 
    token: opts.token,
    public_id: opts.public_id
  });
  
  // Use original dimensions - no restrictions on aspect ratio or size
  const width = asset.width || 1024;
  const height = asset.height || 1024;
  
  // 🆕 [New System] All generation now goes through dedicated functions
  console.log('🆕 [New System] Generation handled by dedicated functions - no old aimlApi needed');
  throw new Error('Direct aimlApi calls are deprecated - use dedicated generation functions');
}

// High-res VIDEO-TO-VIDEO with preset support
export async function runPresetV2V(asset, presetName, fpsActual, opts = {}) {
  const headers = getAuthHeaders(opts);

  // Import dynamically to avoid bundling issues
  const { HARD_LIMITS, PRESETS, DEFAULTS } = await import('../config/freeMode');
  const { clampVideoToHardMax } = await import('./size');
  
  const preset = PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }
  
  // Clamp to video hard limits (4K, 30s, 30fps)
  const { w, h, duration, fps } = clampVideoToHardMax(
    { 
      w: asset.width, 
      h: asset.height, 
      duration: asset.duration, 
      fps: fpsActual 
    },
    {
      maxW: HARD_LIMITS.MAX_VID_W,
      maxH: HARD_LIMITS.MAX_VID_H,
      maxSeconds: HARD_LIMITS.MAX_VID_SECONDS,
      maxFPS: HARD_LIMITS.MAX_VID_FPS
    }
  );
  
  const res = await signedFetch("/.netlify/functions/aimlApi", {
    method: "POST",
    body: JSON.stringify({
      // Force V2V via presence of video_url
      video_url: asset.url, // original URL
      size: `${w}x${h}`,
      prompt: preset.prompt,
      negative_prompt: preset.negative,
      strength: 0.7,        // Strong enough for obvious changes
      keep_audio: true,
      fps, 
      seconds: duration
    }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Transform failed");
  }
  
  const result = await res.json();
  
  console.log("AIML V2V echo:", result.echo);  // Debug what actually happened
  
  // Handle new response format  
  const video_url = result.result_url || result.video_url || result.job_id;
  
  if (!video_url) {
    console.warn("No result_url from V2V server");
    throw new Error("Video transform failed - no result URL");
  }
  
  if (result.source_url && video_url === result.source_url) {
    console.warn("V2V result equals source (not transformed). Try strength 0.8.");
    throw new Error("Transform didn't change much. Try a higher strength or another preset.");
  }

  // Add cache-buster for video results too
  const displayUrl = video_url.includes('http') ? 
    `${video_url}${video_url.includes("?") ? "&" : "?"}t=${Date.now()}` : 
    video_url;
  
  return {
    video_url: displayUrl,
    job_id: result.job_id,
    status: result.status,
    original_asset: asset,
    mode: result.mode,
    source_url: result.source_url
  };
}

// Legacy V2V function for backward compatibility
export async function runV2V(file, prompt, opts = {}) {
  const asset = await uploadToCloudinary(file, { 
    token: opts.token,
    public_id: opts.public_id
  });

  // Use original video dimensions - no restrictions on aspect ratio or size  
  const size = `${asset.width || 1280}x${asset.height || 720}`;
  
  const res = await signedFetch("/.netlify/functions/aimlApi", {
    method: "POST",
    body: JSON.stringify({
      mode: "v2v",
      prompt,
      video_url: asset.url,
      size,
      strength: opts.strength ?? 0.6,  // Bump to 0.6 for more visible changes
      ...(opts.temporal_strength != null ? { temporal_strength: opts.temporal_strength } : {}),
      keep_audio: opts.keep_audio ?? true,
      fps: opts.fps,
      guidance_scale: opts.guidance_scale || 7.5,
      negative_prompt: opts.negative_prompt || "frame, border, title card, captions, subtitles, watermark, extra objects, scene changes",
    }),
  });
  
  if (!res.ok) throw new Error("Transform failed");
  const result = await res.json();
  
  // Handle new response format
  const video_url = result.result_url || result.video_url || result.job_id;
  
  // Guard: if backend accidentally sent the same URL, alert user
  if (!video_url || (result.source_url && video_url === result.source_url)) {
    throw new Error("Transform didn't change much. Try a higher strength (e.g., 0.65) or another preset.");
  }
  
  return {
    video_url,
    job_id: result.job_id,
    status: result.status,
    original_asset: asset,
    mode: result.mode,
    source_url: result.source_url
  };
}
