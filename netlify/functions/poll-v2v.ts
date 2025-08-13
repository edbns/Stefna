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
      const statusBases = [
        "/v2v", "/video/v2v",
        "/video-to-video", "/tasks/video",
        "/v1/v2v", "/eagle/v2v", "/v1/video-to-video"
      ];
      let vendor: any = null;
      let lastRes: Response | null = null;
      
      for (const sb of statusBases) {
        const url = aiml(`${sb}/${encodeURIComponent(id)}`);
        try {
          console.log("[poll-v2v] trying", url);
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${process.env.AIML_API_KEY}` },
          });
          lastRes = res;
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
        vendor?.status || vendor?.state || (lastRes?.ok ? "processing" : "failed");

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

        if (persist && resultUrl) {
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
              console.log("[poll-v2v] uploading video to Cloudinary:", resultUrl);
              const upload = await cloudinary.uploader.upload(resultUrl, {
                resource_type: "video",
                folder: `stefna/outputs/${userId}`,
                tags: ["v2v", "stefna", "type:output"],
                context: {
                  user_id: userId,
                  created_at: new Date().toISOString(),
                },
                overwrite: true,
                invalidate: true,
              });
              resultUrl = upload.secure_url;
              publicId = upload.public_id;
              console.log("[poll-v2v] video uploaded to Cloudinary:", publicId);
            }
          } catch (e) {
            console.error("[poll-v2v] Cloudinary persist failed:", e);
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

    // DB mode not supported in this simplified version
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