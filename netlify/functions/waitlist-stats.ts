// netlify/functions/waitlist-stats.ts
import type { Handler } from '@netlify/functions';
import { q, qOne } from './_db';
import { withAdminSecurity } from './_lib/adminSecurity';
import { handleCORS, getAdminCORSHeaders } from './_lib/cors';

const waitlistStatsHandler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event, true); // true for admin
  if (corsResponse) return corsResponse;

  try {
    if (event.httpMethod === 'GET') {
      console.log('📊 [Waitlist Stats] Fetching waitlist statistics...');
      
      // Get waitlist stats using database function
      const statsResult = await qOne(`
        SELECT get_waitlist_stats() as stats
      `);

      if (!statsResult) {
        throw new Error('Failed to fetch waitlist stats');
      }

      const stats = statsResult.stats;

      // Get recent signups (last 24 hours)
      const recentSignups = await q(`
        SELECT email, referral_code, position, created_at, referred_by
        FROM waitlist
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 50
      `);

      // Get top referrers
      const topReferrers = await q(`
        SELECT 
          referred_by,
          COUNT(*) as referral_count,
          array_agg(email ORDER BY created_at DESC) as referred_emails
        FROM waitlist
        WHERE referred_by IS NOT NULL
        GROUP BY referred_by
        ORDER BY referral_count DESC
        LIMIT 20
      `);

      return {
        statusCode: 200,
        headers: {
          ...getAdminCORSHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          stats: {
            ...stats,
            recentSignups,
            topReferrers
          }
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // Trigger waitlist launch notification
      const { action } = JSON.parse(event.body || '{}');
      
      if (action === 'launch') {
        console.log('🚀 [Waitlist Stats] Triggering launch notification...');
        
        // Call the waitlist-launch function internally
        const launchResult = await qOne(`
          SELECT notify_waitlist_launch() as result
        `);

        return {
          statusCode: 200,
          headers: {
            ...getAdminCORSHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            message: 'Launch notification triggered',
            result: launchResult?.result
          })
        };
      }

      return {
        statusCode: 400,
        headers: {
          ...getAdminCORSHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid action' })
      };
    }

    return {
      statusCode: 405,
      headers: {
        ...getAdminCORSHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error: any) {
    console.error('❌ [Waitlist Stats] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...getAdminCORSHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to fetch waitlist stats',
        details: error.message
      })
    };
  }
};

// Export with admin security middleware
export const handler = withAdminSecurity(waitlistStatsHandler);
