import type { Handler } from "@netlify/functions";
import { q } from './_db';

// Event-based alert helper
async function sendEventAlert(event: string, details: string, data?: any) {
  try {
    const subject = `[EVENT] Stefna Alert: ${event}`
    const body = `
Event: ${event}
Status: INFO
Message: ${event} occurred
Details: ${details}
Data: ${data ? JSON.stringify(data, null, 2) : 'None'}

Time: ${new Date().toLocaleString()}
Dashboard: https://stefna.xyz/dashboard/management/control
`

    await fetch('/.netlify/functions/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'alert@stefna.xyz',
        from: 'alert@stefna.xyz',
        subject,
        text: body,
        type: 'event_alert'
      })
    })

    console.log(`📧 [Event Alert] Sent: ${event} - ${details}`)
  } catch (alertError) {
    console.error(`❌ [Event Alert] Failed to send:`, alertError)
  }
}

// Netlify Scheduled Function (configure in Netlify UI or netlify.toml)
// Cron suggestion: '0 0 * * *' UTC for daily at midnight

export const handler: Handler = async () => {
  try {
    console.log('🔄 [Daily Reset] Starting daily credit reset process...');
    
    // Reset all users to 30 daily credits at midnight UTC
    await q(`
      UPDATE user_credits 
      SET credits = 30, updated_at = NOW()
    `);
    
    console.log('✅ [Daily Reset] Credits reset successfully');
    
    // Send event alert for daily credit reset
    await sendEventAlert('DAILY_CREDIT_RESET', 'Daily credit reset completed successfully', {
      timestamp: new Date().toISOString(),
      creditsReset: 30
    });
    
    // Get all users to send daily credit refresh emails
    const users = await q(`
      SELECT u.id, u.email 
      FROM users u
      WHERE u.email IS NOT NULL
      AND u.id NOT IN (
        SELECT user_id 
        FROM email_preferences 
        WHERE email_type = 'daily_credits_refresh' 
        AND is_unsubscribed = true
      )
    `);
    
    console.log(`📧 [Daily Reset] Sending emails to ${users.length} users`);
    
    let emailsSent = 0;
    let emailsFailed = 0;
    
    // Send daily credit refresh emails
    for (const user of users) {
      try {
        await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: "Your credits are refreshed",
            type: 'daily_credits_refresh'
          })
        });
        
        emailsSent++;
        console.log(`📧 [Daily Reset] Sent email to: ${user.email}`);
        
        // Add a small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (emailError) {
        emailsFailed++;
        console.warn(`⚠️ [Daily Reset] Failed to send email to ${user.email}:`, emailError);
      }
    }
    
    console.log(`✅ [Daily Reset] Process completed: ${emailsSent} emails sent, ${emailsFailed} failed`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        ok: true, 
        message: 'Daily credits reset and emails sent',
        stats: {
          emailsSent,
          emailsFailed,
          totalUsers: users.length
        }
      })
    };
  } catch (error) {
    console.error('💥 [reset-daily-credits] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'RESET_FAILED', message: (error as Error).message })
    };
  }
};


