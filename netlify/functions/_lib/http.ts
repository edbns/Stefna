export function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}
export function mapPgError(e: any) {
  if (String(e?.message).includes("INSUFFICIENT_CREDITS")) return json(402, { ok:false, error:"INSUFFICIENT_CREDITS" });
  if (String(e?.message).includes("INVALID_FINALIZE_STATUS")) return json(400, { ok:false, error:"INVALID_FINALIZE_STATUS" });
  if (e?.statusCode) return json(e.statusCode, { ok:false, error: e.message });
  return json(500, { ok:false, error:"INTERNAL_ERROR" });
}
