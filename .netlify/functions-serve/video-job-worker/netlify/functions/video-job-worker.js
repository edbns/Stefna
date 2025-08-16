"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/video-job-worker.ts
var video_job_worker_exports = {};
__export(video_job_worker_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(video_job_worker_exports);
var import_supabase_js = require("@supabase/supabase-js");

// netlify/functions/_cloudinary.ts
var import_cloudinary = require("cloudinary");
function assertCloudinaryEnv() {
  const missing = [
    ["CLOUDINARY_CLOUD_NAME", process.env.CLOUDINARY_CLOUD_NAME],
    ["CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY],
    ["CLOUDINARY_API_SECRET", process.env.CLOUDINARY_API_SECRET]
  ].filter(([k, v]) => !v).map(([k]) => k);
  if (missing.length) {
    const msg = `Missing Cloudinary env: ${missing.join(", ")}`;
    console.error("[cloudinary] " + msg);
    const err = new Error(msg);
    err.code = "ENV_MISSING";
    throw err;
  }
}
function initCloudinary() {
  assertCloudinaryEnv();
  import_cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  return import_cloudinary.v2;
}

// netlify/functions/video-job-worker.ts
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var AIML_API_KEY = process.env.AIML_API_KEY;
var AIML_V2V_ENDPOINT = process.env.AIML_V2V_ENDPOINT || "https://api.aimlapi.com/v1/video-to-video";
var V2V_WEBHOOK_SECRET = process.env.V2V_WEBHOOK_SECRET || "";
var CLARITY_BOOST_HARD = "maximize micro-contrast and fine detail; razor-sharp edges; crisp textures (hair, neoprene seams, surfboard wax); strictly no halos or oversharpening artifacts; preserve natural skin texture";
var SURFER_POS_LOCK = "same subject, adult male surfer, holding a surfboard, same clothing and gear, same pose and camera angle, same composition on a beach with ocean waves";
var SURFER_NEG_DRIFT = "female, woman, girl, bikini, makeup glam, banana, banana boat, inflatable, kayak, canoe, raft, jetski, paddle, oar, dinghy, extra people, different subject, face swap, body swap";
async function processStoryJob(supabase, job, job_id) {
  const cloudinary2 = initCloudinary();
  const shotFiles = [];
  try {
    for (let i = 0; i < job.shotlist.length; i++) {
      const shot = job.shotlist[i];
      const shotPrompt = `${job.prompt}. ${shot.add}. ${CLARITY_BOOST_HARD}. ${SURFER_POS_LOCK}`;
      const negativePrompt = `${job.params.negative}, ${SURFER_NEG_DRIFT}`;
      console.log(`[Story] Generating shot ${i + 1}/${job.shotlist.length}: ${shot.name}`);
      const payload = {
        model: job.model,
        prompt: shotPrompt,
        negative_prompt: negativePrompt,
        image_url: job.source_url,
        strength: job.params.strength,
        num_inference_steps: job.params.steps,
        guidance_scale: job.params.guidance,
        seed: Date.now() + i
        // Different seed per shot
      };
      const response = await fetch("https://api.aimlapi.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AIML_API_KEY}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Shot ${i + 1} failed: ${response.status} ${await response.text()}`);
      }
      const result = await response.json();
      const imageUrl = result?.images?.[0]?.url || result?.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error(`Shot ${i + 1}: No image URL in response`);
      }
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const fs = require("fs");
      const path = require("path");
      const tempDir = "/tmp";
      const shotFile = path.join(tempDir, `shot_${i + 1}.jpg`);
      fs.writeFileSync(shotFile, Buffer.from(imageBuffer));
      shotFiles.push(shotFile);
      const progress = Math.round((i + 1) / job.shotlist.length * 80);
      await supabase.from("video_jobs").update({ progress }).eq("id", job_id);
    }
    console.log("[Story] Stitching shots into MP4...");
    const { execSync } = require("child_process");
    const outputFile = "/tmp/story.mp4";
    const duration = 2.6;
    const fadeDuration = 0.4;
    const ffmpegCmd = `
      ffmpeg -y \\
        -loop 1 -t ${duration} -i ${shotFiles[0]} \\
        -loop 1 -t ${duration} -i ${shotFiles[1]} \\
        -loop 1 -t ${duration} -i ${shotFiles[2]} \\
        -loop 1 -t ${duration} -i ${shotFiles[3]} \\
        -filter_complex "
        [0:v]scale=${job.width}:${job.height},zoompan=z='min(zoom+0.0015,1.08)':d=${Math.round(duration * job.fps)}:s=${job.width}x${job.height}:fps=${job.fps},format=yuv420p[v0];
        [1:v]scale=${job.width}:${job.height},zoompan=z='min(zoom+0.0015,1.08)':d=${Math.round(duration * job.fps)}:s=${job.width}x${job.height}:fps=${job.fps},format=yuv420p[v1];
        [2:v]scale=${job.width}:${job.height},zoompan=z='min(zoom+0.0015,1.08)':d=${Math.round(duration * job.fps)}:s=${job.width}x${job.height}:fps=${job.fps},format=yuv420p[v2];
        [3:v]scale=${job.width}:${job.height},zoompan=z='min(zoom+0.0015,1.08)':d=${Math.round(duration * job.fps)}:s=${job.width}x${job.height}:fps=${job.fps},format=yuv420p[v3];
        [v0][v1]xfade=transition=fade:duration=${fadeDuration}:offset=${duration}[v01];
        [v01][v2]xfade=transition=fade:duration=${fadeDuration}:offset=${duration * 2}[v012];
        [v012][v3]xfade=transition=fade:duration=${fadeDuration}:offset=${duration * 3}[v]
        " -map "[v]" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -movflags +faststart ${outputFile}
    `.replace(/\s+/g, " ").trim();
    execSync(ffmpegCmd, { stdio: "inherit" });
    console.log("[Story] Uploading MP4 to Cloudinary...");
    const visibilityTag = (job.visibility || "private") === "public" ? "public" : void 0;
    const tags = ["stefna", "type:story", `user:${job.user_id}`].concat(visibilityTag ? [visibilityTag] : []);
    const upload = await cloudinary2.uploader.upload(outputFile, {
      resource_type: "video",
      folder: `stefna/stories/${job.user_id}`,
      tags,
      context: {
        user_id: job.user_id,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        job_id,
        type: "story"
      },
      overwrite: true,
      invalidate: true
    });
    if (!upload?.public_id || !upload?.secure_url) {
      throw new Error("Cloudinary upload failed");
    }
    await supabase.from("video_jobs").update({ status: "completed", output_url: upload.secure_url, progress: 100 }).eq("id", job_id);
    shotFiles.forEach((file) => {
      try {
        require("fs").unlinkSync(file);
      } catch (e) {
      }
    });
    try {
      require("fs").unlinkSync(outputFile);
    } catch (e) {
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, job_id, result_url: upload.secure_url, public_id: upload.public_id, type: "story" }) };
  } catch (error) {
    console.error("[Story] Error:", error);
    await supabase.from("video_jobs").update({ status: "failed", error: error.message?.slice(0, 2e3) || "failed" }).eq("id", job_id);
    shotFiles.forEach((file) => {
      try {
        require("fs").unlinkSync(file);
      } catch (e) {
      }
    });
    return { statusCode: 200, body: JSON.stringify({ ok: false, job_id, error: error.message }) };
  }
}
var handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  const secret = event.headers["x-internal"];
  if (secret !== "1") return { statusCode: 403, body: "Forbidden" };
  const supabase = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { job_id } = JSON.parse(event.body || "{}");
  if (!job_id) return { statusCode: 400, body: "job_id required" };
  let job = null;
  let isStoryJob = false;
  try {
    const { data: storyJob, error: storyErr } = await supabase.from("video_jobs").select("id,user_id,source_url,prompt,model,params,shotlist,fps,width,height,allow_remix,visibility,type,status").eq("id", job_id).single();
    if (storyJob && !storyErr) {
      job = storyJob;
      isStoryJob = true;
    }
  } catch (e) {
  }
  if (!job) {
    const { data: v2vJob, error: v2vErr } = await supabase.from("ai_generations").select("id,user_id,input_url,preset,visibility,status").eq("id", job_id).single();
    if (v2vErr || !v2vJob) return { statusCode: 404, body: "Job not found" };
    job = v2vJob;
  }
  if (job.status !== "queued") return { statusCode: 200, body: JSON.stringify({ ok: true, message: "Already handled", status: job.status }) };
  const updateTable = isStoryJob ? "video_jobs" : "ai_generations";
  await supabase.from(updateTable).update({ status: "processing", progress: 1 }).eq("id", job_id);
  try {
    if (isStoryJob && job.type === "story") {
      return await processStoryJob(supabase, job, job_id);
    }
    const base = process.env.URL || process.env.DEPLOY_URL || process.env.DEPLOY_PRIME_URL || "";
    const callbackUrl = base ? `${base}/.netlify/functions/v2v-webhook` : void 0;
    const payload = {
      model: "flux/dev/video-to-video",
      prompt: job.preset || "stylize",
      video_url: job.input_url,
      strength: 0.85,
      num_inference_steps: 36,
      guidance_scale: 7.5
    };
    if (callbackUrl) payload.callback_url = callbackUrl;
    if (V2V_WEBHOOK_SECRET) payload.webhook_secret = V2V_WEBHOOK_SECRET;
    payload.metadata = { jobId: job_id };
    const pRes = await fetch(AIML_V2V_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${AIML_API_KEY}` },
      body: JSON.stringify(payload)
    });
    if (!pRes.ok) {
      const t = await pRes.text();
      throw new Error(`Provider error ${pRes.status}: ${t}`);
    }
    const provider = await pRes.json();
    let resultUrl = provider.result_url || null;
    let providerJobId = provider.job_id || provider.id || null;
    if (!resultUrl && providerJobId) {
      const statusUrl = `${AIML_V2V_ENDPOINT}/${providerJobId}`;
      const started = Date.now();
      while (Date.now() - started < 42e4) {
        await new Promise((r) => setTimeout(r, 3e3));
        const sRes = await fetch(statusUrl, { headers: { Authorization: `Bearer ${AIML_API_KEY}` } });
        const sJson = await sRes.json();
        try {
          await supabase.from(updateTable).update({ status: "processing" }).eq("id", job_id);
        } catch {
        }
        if ((sJson.status === "succeeded" || sJson.state === "completed") && (sJson.result_url || sJson.outputUrl)) {
          resultUrl = sJson.result_url || sJson.outputUrl;
          break;
        }
        if (sJson.status === "failed" || sJson.status === "canceled" || sJson.state === "failed") {
          throw new Error(`Provider job ${sJson.status || sJson.state}: ${sJson.error || ""}`);
        }
      }
    }
    if (!resultUrl) {
      throw new Error("No result_url from provider");
    }
    const cloudinary2 = initCloudinary();
    const visibilityTag = (job.visibility || "private") === "public" ? "public" : void 0;
    const tags = ["stefna", "type:output", `user:${job.user_id}`].concat(visibilityTag ? [visibilityTag] : []);
    const upload = await cloudinary2.uploader.upload(resultUrl, {
      resource_type: "video",
      folder: `stefna/outputs/${job.user_id}`,
      tags,
      context: {
        user_id: job.user_id,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        job_id,
        provider_job_id: providerJobId || ""
      },
      overwrite: true,
      invalidate: true
    });
    if (!upload?.public_id || !upload?.secure_url) {
      throw new Error("Cloudinary upload failed or missing public_id/secure_url");
    }
    await supabase.from(updateTable).update({ status: "completed", output_url: upload.secure_url, progress: 100 }).eq("id", job_id);
    return { statusCode: 200, body: JSON.stringify({ ok: true, job_id, result_url: upload.secure_url, public_id: upload.public_id }) };
  } catch (e) {
    await supabase.from(updateTable).update({ status: "failed", error: e.message?.slice(0, 2e3) || "failed" }).eq("id", job_id);
    return { statusCode: 200, body: JSON.stringify({ ok: false, job_id, error: e.message }) };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=video-job-worker.js.map
