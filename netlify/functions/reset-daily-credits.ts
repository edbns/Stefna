import type { Handler } from "@netlify/functions";
import { q } from './_db';

// Netlify Scheduled Function (configure in Netlify UI or netlify.toml)
// Cron suggestion: '0 0 * * *' UTC for daily at midnight

export const handler: Handler = async () => {
  try {
    // Reset all users to 30 daily credits at midnight UTC
    await q(`
      UPDATE user_credits 
      SET credits = 30, updated_at = NOW()
    `);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Daily credits reset to 30 for all users' })
    };
  } catch (error) {
    console.error('💥 [reset-daily-credits] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'RESET_FAILED', message: (error as Error).message })
    };
  }
};


