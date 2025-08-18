export function json<T = unknown>(body: T, options?: { status?: number; headers?: Record<string, string> }) {
  const status = options?.status ?? 200;
  const headers = {
    "content-type": "application/json",
    ...options?.headers
  };
  
  return {
    statusCode: status,
    headers,
    body: JSON.stringify(body)
  };
}
export function mapPgError(e: any) {
  if (String(e?.message).includes("INSUFFICIENT_CREDITS")) return json({ ok:false, error:"INSUFFICIENT_CREDITS" }, { status: 402 });
  if (String(e?.message).includes("INVALID_FINALIZE_STATUS")) return json({ ok:false, error:"INVALID_FINALIZE_STATUS" }, { status: 400 });
  if (e?.statusCode) return json({ ok:false, error: e.message }, { status: e.statusCode });
  return json({ ok:false, error:"INTERNAL_ERROR" }, { status: 500 });
}
