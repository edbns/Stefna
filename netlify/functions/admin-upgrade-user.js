const { neon } = require('@neondatabase/serverless');
const { resp, handleCORS, sanitizeDatabaseUrl } = require('./_auth');

// ---- Database connection with safe URL sanitization ----
const cleanDbUrl = sanitizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || '');
if (!cleanDbUrl) {
  throw new Error('NETLIFY_DATABASE_URL environment variable is required');
}
const sql = neon(cleanDbUrl);

exports.handler = async (event, context) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method not allowed' });
  }

  try {
    const { email, newTier, adminSecret } = JSON.parse(event.body);

    // Validate admin secret (you should change this to a secure secret)
    const expectedSecret = process.env.ADMIN_SECRET || 'stefna-admin-2024';
    if (adminSecret !== expectedSecret) {
      return resp(401, { error: 'Unauthorized' });
    }

    // Validate input
    if (!email || !newTier) {
      return resp(400, { error: 'Email and newTier are required' });
    }

    // Validate tier
    const validTiers = ['registered', 'verified', 'contributor'];
    if (!validTiers.includes(newTier)) {
      return resp(400, { error: 'Invalid tier. Must be one of: registered, verified, contributor' });
    }

    // Find user by email
    const userResult = await sql`
      SELECT *
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `;

    if (!userResult || userResult.length === 0) {
      return resp(404, { error: 'User not found' });
    }

    const user = userResult[0];

    // Update user tier
    const updateResult = await sql`
      UPDATE users 
      SET tier = ${newTier}
      WHERE email = ${email}
      RETURNING *
    `;

    if (!updateResult || updateResult.length === 0) {
      return resp(500, { error: 'Failed to update user tier' });
    }

    const updatedUser = updateResult[0];
    console.log(`✅ Successfully upgraded user ${email} to ${newTier} tier`);

    return resp(200, {
      success: true,
      message: `User ${email} successfully upgraded to ${newTier} tier`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Admin upgrade error:', error);
    return resp(500, { error: error.message || 'Internal server error' });
  }
};
