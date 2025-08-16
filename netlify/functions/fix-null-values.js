const { neon } = require('@neondatabase/serverless');
const { requireJWTUser, resp, handleCORS, sanitizeDatabaseUrl } = require('./_auth');

// ---- Database connection with safe URL sanitization ----
const cleanDbUrl = sanitizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || '');
if (!cleanDbUrl) {
  throw new Error('NETLIFY_DATABASE_URL environment variable is required');
}
const sql = neon(cleanDbUrl);

exports.handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method Not Allowed' });
  }

  try {
    // Use new authentication helper
    const user = requireJWTUser(event);
    
    if (!user) {
      return resp(401, { error: 'Authentication required' });
    }

    const body = JSON.parse(event.body || '{}');
    const { action, env = 'prod' } = body;

    if (action !== 'fix-null-values') {
      return resp(400, { error: 'Invalid action' });
    }

    console.log(`🔧 Fixing null values for user ${user.userId}, setting env to: ${env}`);

    // Find all images with null env or visibility for this user
    const nullImages = await sql`
      SELECT id, env, visibility, created_at
      FROM media_assets
      WHERE owner_id = ${user.userId}
      AND (env IS NULL OR visibility IS NULL)
    `;

    if (!nullImages || nullImages.length === 0) {
      return resp(200, { 
        message: 'No null values found to fix',
        fixed: 0 
      });
    }

    console.log(`📊 Found ${nullImages.length} images with null values to fix`);

    // Fix all null values: set env and make private (safer default)
    const fixed = await sql`
      UPDATE media_assets 
      SET env = ${env},
          visibility = 'private',
          updated_at = NOW()
      WHERE owner_id = ${user.userId}
      AND (env IS NULL OR visibility IS NULL)
      RETURNING id, env, visibility, updated_at
    `;

    console.log(`✅ Successfully fixed ${fixed?.length || 0} images with null values`);

    return resp(200, {
      message: `Fixed ${fixed?.length || 0} images with null values`,
      fixed: fixed?.length || 0,
      items: fixed
    });

  } catch (error) {
    console.error('❌ Fix null values error:', error);
    return resp(500, { error: error?.message || 'Internal server error' });
  }
};
