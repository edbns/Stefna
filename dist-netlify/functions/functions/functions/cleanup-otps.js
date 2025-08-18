"use strict";
const { neon } = require('@neondatabase/serverless');
const { resp, sanitizeDatabaseUrl } = require('./_auth');
// ---- Database connection with safe URL sanitization ----
const cleanDbUrl = sanitizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || '');
if (!cleanDbUrl) {
    throw new Error('NETLIFY_DATABASE_URL environment variable is required');
}
const sql = neon(cleanDbUrl);
exports.handler = async () => {
    try {
        const now = new Date().toISOString();
        // Clean up expired or used OTPs
        const result = await sql `
      DELETE FROM user_otps 
      WHERE expires_at < ${now} OR used = true
    `;
        console.log(`🧹 Cleaned up OTPs: ${result.rowCount || 0} rows affected`);
        return resp(200, {
            success: true,
            cleaned: result.rowCount || 0
        });
    }
    catch (error) {
        console.error('❌ OTP cleanup error:', error);
        return resp(500, { error: error.message || 'Internal server error' });
    }
};
