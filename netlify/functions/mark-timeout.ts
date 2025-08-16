import type { Handler } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { resp, handleCORS, sanitizeDatabaseUrl } from './_auth'

// ---- Database connection with safe URL sanitization ----
const cleanDbUrl = sanitizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || '');
if (!cleanDbUrl) {
  throw new Error('NETLIFY_DATABASE_URL environment variable is required');
}
const sql = neon(cleanDbUrl);

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method Not Allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const id = body?.id as string | undefined;
    const reason = (body?.reason as string | undefined) || 'client finalized after watchdog';

    if (!id) {
      return resp(400, { error: 'missing id' });
    }

    // Mark generation as timed out
    const result = await sql`
      UPDATE ai_generations 
      SET status = 'timeout', error = ${reason}
      WHERE id = ${id} 
      AND status IN ('queued', 'processing')
    `;

    if (result.rowCount === 0) {
      return resp(404, { error: 'Generation not found or already processed' });
    }

    console.log(`⏰ Marked generation ${id} as timeout: ${reason}`);

    return resp(200, { 
      success: true, 
      message: 'Generation marked as timeout',
      affected: result.rowCount 
    });

  } catch (error: any) {
    console.error('❌ Mark timeout error:', error);
    return resp(500, { error: error?.message || 'Internal server error' });
  }
};


