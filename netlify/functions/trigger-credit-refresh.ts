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

    // If users were processed, automatically process the email queue
    if (responseData.users_processed > 0) {
      console.log('📧 [Credit Refresh] Processing email queue automatically...');
      
      try {
        // Call the email notification listener to process queued emails
        const emailResponse = await fetch(`${process.env.URL || 'https://stefna.xyz'}/.netlify/functions/email-notification-listener`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log('✅ [Credit Refresh] Email queue processed:', emailResult);
        } else {
          console.error('❌ [Credit Refresh] Email processing failed:', emailResponse.status);
        }
      } catch (emailError) {
        console.error('❌ [Credit Refresh] Email processing error:', emailError);
        // Don't fail the credit refresh if email processing fails
      }
    }

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
