import type { Handler } from "@netlify/functions";
import { qOne } from './_db';
import { json } from './_lib/http';

// ============================================================================
// TRIGGER CREDIT REFRESH - External Trigger
// ============================================================================
// This function can be called by external cron services to trigger
// the database function that queues credit refresh emails
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    console.log('🔄 [Credit Refresh] Starting credit refresh check...');
    
    // Call the database function that handles the credit refresh logic
    const result = await qOne(`
      SELECT trigger_credit_refresh_check() as result
    `);

    if (!result) {
      throw new Error('Database function returned no result');
    }

    const responseData = result.result;
    console.log('✅ [Credit Refresh] Check completed:', responseData);

    return json({
      success: true,
      message: 'Credit refresh check completed successfully',
      data: responseData
    });

  } catch (error: any) {
    console.error('💥 [Credit Refresh] Error:', error);
    return json({ 
      success: false, 
      error: 'Credit refresh check failed',
      details: error.message 
    }, { status: 500 });
  }
};
