// src/lib/credits.ts
export async function runGeneration({
  token,
  action = "image.gen" as const,
  baseUrl = "/.netlify/functions",
  runJob, // (requestId) => Promise<{ ok: boolean }>
}: {
  token: string;
  action?: "image.gen" | "video.gen";
  baseUrl?: string;
  runJob: (requestId: string) => Promise<{ ok: boolean }>;
}) {
  const requestId = crypto.randomUUID();

  // reserve - using credits-reserve function
  const r = await fetch(`${baseUrl}/credits-reserve`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, cost: 2 }), // Updated to match new API
  });
  if (r.status === 401) throw new Error("Please sign in again.");
  if (r.status === 402) throw new Error("Not enough credits.");
  if (r.status === 429) throw new Error("Daily cap reached.");
  if (!r.ok) throw new Error((await r.json()).error ?? "Reserve failed");

  // run AIML job
  let success = false;
  try {
    const out = await runJob(requestId);
    success = !!out?.ok;
  } catch { success = false; }

  // finalize
  const f = await fetch(`${baseUrl}/credits-finalize`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ request_id: requestId, disposition: success ? "commit" : "refund" }),
  });
  if (!f.ok) console.warn("Finalize non-OK", await f.text());

  if (!success) throw new Error("Generation failed.");
  return { ok: true, requestId };
}
