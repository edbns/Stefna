import type { Handler } from "@netlify/functions";

const A = (p: string) => `${(process.env.AIML_API_URL || "").replace(/\/+$/, "")}${p}`;

export const handler: Handler = async (event) => {
  try {
    if (String(process.env.NO_DB_MODE).toLowerCase() !== "true") {
      return j(500, { ok: false, error: "DB mode not supported here" });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const videoUrl: string = body.video_url || body.input_url || body.source || body.source_url;
    const prompt: string = body.prompt || "";

    if (!videoUrl) return j(400, { ok: false, error: "Missing video_url" });

    // Optional webhook
    const site = (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/+$/, "");
    const webhookUrl =
      body.webhook_url ||
      body.callback_url ||
      (site ? `${site}/.netlify/functions/v2v-webhook` : undefined);

    const payload: any = {
      // send several aliases so different vendors accept one
      video_url: videoUrl,
      input_url: videoUrl,
      input_video: videoUrl,
      source: videoUrl,
      prompt,
      webhook_url: webhookUrl,
      callback_url: webhookUrl,
      webhook_secret: process.env.V2V_WEBHOOK_SECRET || undefined,
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AIML_API_KEY}`,
    } as Record<string, string>;

    // Try common endpoint variants - prioritize /video-to-video/start first
    const candidates = [
      "/video-to-video/start",
      "/v2v/start", 
      "/v1/video-to-video/start",
      "/v1/v2v/start",
      "/video/v2v/start", 
      "/tasks/video/start", 
      "/eagle/v2v/start", 
      "/video-to-video",
      "/v2v",
      "/video/v2v",
      "/tasks/video",
      "/v1/v2v",
      "/eagle/v2v",
      "/v1/video-to-video", 
    ];
    let out: any = null;
    let lastStatus = 0;
    let lastText = "";

    for (const path of candidates) {
      const url = A(path);
      try {
        console.log("[start-v2v] trying", url);
        const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
        lastStatus = res.status;
        lastText = await res.text();
        if (res.ok || res.status === 202) { out = safeJson(lastText); break; }
        if (res.status === 404 || res.status === 405) {
          console.log("[start-v2v] path not found", url, res.status);
          continue;
        }
        out = safeJson(lastText);
        break;
      } catch (err:any) {
        console.log("[start-v2v] error on", url, err?.message || err);
      }
    }

    if (!out || lastStatus >= 400) {
      return j(404, {
        ok: false,
        error: `Vendor rejected start (${lastStatus}). Body: ${truncate(lastText, 400)}`,
        hint: "Check AIML_API_URL base (no /v2v suffix) and key; provider may use POST /v2v, not /v2v/start.",
      });
    }

    // Normalize job id
    const jobId =
      out.job_id || out.id || out.task_id || out.request_id || out.data?.id || out.data?.job_id;

    if (!jobId) {
      return j(502, {
        ok: false,
        error: "Start succeeded but no job id in response",
        raw: out,
      });
    }

    return j(202, { ok: true, job_id: jobId });
  } catch (e: any) {
    console.error("start-v2v error", e);
    return j(500, { ok: false, error: e?.message || "Server error" });
  }
};

function j(statusCode: number, body: any) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
function safeJson(t: string) { try { return JSON.parse(t); } catch { return { raw: t }; } }
function truncate(s = "", n = 200) { return s.length > n ? s.slice(0, n) + "…" : s; }
