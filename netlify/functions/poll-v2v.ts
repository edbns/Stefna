import type { Handler } from "@netlify/functions";

const aiml = (path: string) =>
  `${(process.env.AIML_API_URL || "").replace(/\/+$/, "")}${path}`;

export const handler: Handler = async (event) => {
  try {
    const id = event.queryStringParameters?.id;
    if (!id) {
      return resp(400, { ok: false, error: "Missing id" });
    }

    // NO_DB_MODE: talk straight to vendor
    if (String(process.env.NO_DB_MODE).toLowerCase() === "true") {
      // Try multiple common status paths
      const statusBases = [ "/v2v", "/eagle/v2v", "/v1/v2v", "/video/v2v" ];
      let vendor: any = null;
      for (const sb of statusBases) {
        const url = aiml(`${sb}/${encodeURIComponent(id)}`);
        try {
          console.log("[poll-v2v] trying", url);
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${process.env.AIML_API_KEY}` },
          });
          if (res.ok) { vendor = await res.json().catch(() => ({} as any)); break; }
          if (res.status === 404) continue;
          const t = await res.text().catch(() => '');
          console.warn("[poll-v2v] non-404 status", res.status, t);
        } catch (e:any) {
          console.warn("[poll-v2v] error", e?.message || e);
        }
      }

      if (!vendor) {
        return resp(502, { ok:false, status:'failed', job_id: id, error: 'All status paths failed' });
      }
      const vStatus =
        vendor?.status || vendor?.state || (res.ok ? "processing" : "failed");

      // Still running
      if (["queued", "processing", "running"].includes(vStatus)) {
        return resp(200, { ok: true, status: "processing", job_id: id });
      }

      // Failed
      if (["failed", "error", "cancelled"].includes(vStatus)) {
        return resp(200, {
          ok: false,
          status: "failed",
          job_id: id,
          error: vendor?.error?.message || vendor?.message || "Job failed",
        });
      }

      // Completed
      if (["completed", "succeeded", "done"].includes(vStatus)) {
        let resultUrl: string | undefined =
          vendor?.result_url || vendor?.data?.result_url || vendor?.url;

        if (!resultUrl) {
          // Defensive: sometimes providers nest differently
          resultUrl =
            vendor?.data?.output_url ||
            vendor?.output?.url ||
            vendor?.result?.url;
        }

        // Nothing to show? Return a friendly error.
        if (!resultUrl) {
          return resp(200, {
            ok: false,
            status: "failed",
            job_id: id,
            error: "Provider returned no result_url",
          });
        }

        // Optional: persist to Cloudinary if asked
        const persist = event.queryStringParameters?.persist === "true";
        const userId =
          event.queryStringParameters?.userId?.toString() || "public";

        let publicId: string | null = null;

        if (persist) {
          try {
            const { v2: cloudinary } = await import("cloudinary");
            cloudinary.config({
              cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
              api_key: process.env.CLOUDINARY_API_KEY!,
              api_secret: process.env.CLOUDINARY_API_SECRET!,
            });

            // If the result is already on the same Cloudinary cloud, reuse the publicId.
            const sameCloud = resultUrl.includes(
              `res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`
            );
            if (sameCloud) {
              const afterUpload = resultUrl.split("/upload/")[1] || "";
              publicId =
                afterUpload.replace(/\.[a-z0-9]+$/i, "").split("?")[0] || null;
            } else {
              // Upload remote video URL to your Cloudinary
              const upload = await cloudinary.uploader.upload(resultUrl, {
                resource_type: "video",
                folder: `stefna/outputs/${userId}`,
                tags: ["v2v", "stefna"],
              });
              resultUrl = upload.secure_url;
              publicId = upload.public_id;
            }
          } catch (e) {
            console.error("Cloudinary persist failed:", e);
            // Fall through: return vendor URL even if persist fails
          }
        }

        return resp(200, {
          ok: true,
          status: "completed",
          job_id: id,
          data: { mediaType: "video", resultUrl, publicId },
        });
      }

      // Unknown status -> treat as processing to keep UI polling
      return resp(200, { ok: true, status: "processing", job_id: id });
    }

    // (Legacy DB mode path omitted on purpose)
    return resp(500, {
      ok: false,
      error: "DB mode not supported in this function",
    });
  } catch (err: any) {
    console.error("poll-v2v error:", err);
    return resp(500, { ok: false, error: err?.message || "Server error" });
  }
};

function resp(code: number, body: any) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

function ok(body: any) { return { statusCode: 200, body: JSON.stringify(body) } }
function bad(status: number, message: string) { return { statusCode: status, body: JSON.stringify({ ok:false, error: message }) } }

const MAX_PROCESSING_MIN = 4
const HEARTBEAT_STALE_SEC = 90

export const handler: Handler = async (event) => {
  try {
    const method = event.httpMethod
    if (method !== 'GET' && method !== 'POST') return bad(405, 'Method Not Allowed')

    const params = method === 'GET' ? (event.queryStringParameters || {}) : JSON.parse(event.body || '{}')
    const jobId = params.id || params.job_id
    if (!jobId) return bad(400, 'job_id required')

    // NO_DB_MODE: poll vendor directly and optionally persist
    if (process.env.NO_DB_MODE === 'true') {
      const { AIML_API_URL, AIML_API_KEY } = process.env as any
      if (!AIML_API_URL || !AIML_API_KEY) return bad(500, 'MISSING_AIML_CONFIG')

      const res = await fetch(`${AIML_API_URL.replace(/\/$/, '')}/v2v/${jobId}`, {
        headers: { Authorization: `Bearer ${AIML_API_KEY}` }
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        return ok({ ok:false, status:'failed', job_id: jobId, error: text || 'UPSTREAM_ERROR' })
      }
      const data = await res.json().catch(() => ({}))
      const status = String(data.status || data.state || '').toLowerCase()
      if (!['succeeded','done','failed','error'].includes(status)) {
        return ok({ ok:true, status:'processing', job_id: jobId, progress: data.progress ?? null })
      }
      if (['failed','error'].includes(status)) {
        return ok({ ok:false, status:'failed', job_id: jobId, error: data.error || data.message || 'failed' })
      }
      const resultUrl = data.result_url || data.video_url || data.url || null
      if (!resultUrl) return ok({ ok:false, status:'failed', job_id: jobId, error: 'NO_RESULT_URL' })
      return ok({ ok:true, status:'completed', job_id: jobId, data: { mediaType: 'video', resultUrl, publicId: null } })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: job, error } = await supabase
      .from('ai_generations')
      .select('id,status,progress,output_url,error,created_at,updated_at,kind')
      .eq('id', jobId)
      .single()
    if (error || !job) return ok({ ok:false, status:'failed', job_id: jobId, error: 'not_found' })

    // finalize stale
    const created = new Date(job.created_at).getTime()
    const updated = new Date(job.updated_at || job.created_at).getTime()
    const now = Date.now()
    const tookMin = (now - created) / 60000
    const staleSec = (now - updated) / 1000

    if ((job.status === 'queued' || job.status === 'processing') && (tookMin > MAX_PROCESSING_MIN || staleSec > HEARTBEAT_STALE_SEC)) {
      await supabase.from('ai_generations').update({ status: 'timeout', error: `timed out after ${tookMin.toFixed(1)} min, stale ${staleSec}s` }).eq('id', jobId).in('status', ['queued','processing'])
      return ok({ ok:false, status:'timeout', job_id: jobId, error: 'timeout' })
    }

    if (job.status === 'queued' || job.status === 'processing') {
      return ok({ ok:true, status:'processing', job_id: jobId, progress: job.progress ?? null })
    }

    if (job.status === 'failed' || job.status === 'timeout') {
      return ok({ ok:false, status: job.status, job_id: jobId, error: job.error || job.status })
    }

    // completed
    const resultUrl = job.output_url || null
    return ok({ ok:true, status:'completed', job_id: jobId, data: {
      mediaType: job.kind || 'video',
      resultUrl,
      publicId: resultUrl ? null : null
    } })
  } catch (e:any) {
    return ok({ ok:false, status:'failed', error: e?.message || 'poll-v2v error' })
  }
}


