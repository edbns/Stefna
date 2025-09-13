import type { Handler } from "@netlify/functions";
import { q, qOne } from './_db';
import { json } from './_lib/http';

// Inactive user reminder system
// Sends reminder emails to users who haven't been active for 3+ days
export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('📧 [Inactive Reminder] Starting inactive user reminder process...');

    // Find users who haven't been active for 3+ days and haven't received reminder in last 3 days
    const inactiveUsers = await q(`
      SELECT DISTINCT u.id, u.email, u.created_at
      FROM users u
      WHERE u.created_at < NOW() - INTERVAL '3 days'
      AND u.id NOT IN (
        SELECT DISTINCT user_id 
        FROM (
          SELECT user_id FROM neo_glitch_media WHERE created_at > NOW() - INTERVAL '3 days'
          UNION ALL
          SELECT user_id FROM ghibli_reaction_media WHERE created_at > NOW() - INTERVAL '3 days'
          UNION ALL
          SELECT user_id FROM unreal_reflection_media WHERE created_at > NOW() - INTERVAL '3 days'
          UNION ALL
          SELECT user_id FROM presets_media WHERE created_at > NOW() - INTERVAL '3 days'
          UNION ALL
          SELECT user_id FROM custom_prompt_media WHERE created_at > NOW() - INTERVAL '3 days'
          UNION ALL
          SELECT user_id FROM story WHERE created_at > NOW() - INTERVAL '3 days'
        ) active_users
      )
      AND u.id NOT IN (
        SELECT DISTINCT user_id 
        FROM credits_ledger 
        WHERE created_at > NOW() - INTERVAL '3 days'
      )
      AND u.id NOT IN (
        SELECT user_id 
        FROM email_preferences 
        WHERE email_type = 'inactive_reminder' 
        AND is_unsubscribed = true
      )
      AND u.id NOT IN (
        SELECT user_id 
        FROM email_preferences 
        WHERE email_type = 'inactive_reminder' 
        AND last_sent_at > NOW() - INTERVAL '3 days'
      )
      LIMIT 50
    `);

    console.log(`📧 [Inactive Reminder] Found ${inactiveUsers.length} inactive users`);

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send reminder emails to inactive users
    for (const user of inactiveUsers) {
      try {
        await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: "Haven't seen you in a while",
            text: `Hey there,

Just a quick reminder — your daily credits on Stefna have refreshed.

Come back and transform your next photo. It only takes a moment.

See what you can create → Stefna

Don't want these emails? Unsubscribe.`,
            type: 'inactive_reminder'
          })
        });
        
        // Record that email was sent
        await q(`
          SELECT record_email_sent($1, 'inactive_reminder')
        `, [user.id]);
        
        emailsSent++;
        console.log(`📧 [Inactive Reminder] Sent reminder to: ${user.email}`);
        
        // Add a small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (emailError) {
        emailsFailed++;
        console.warn(`⚠️ [Inactive Reminder] Failed to send email to ${user.email}:`, emailError);
      }
    }

    console.log(`✅ [Inactive Reminder] Process completed: ${emailsSent} sent, ${emailsFailed} failed`);

    return json({
      success: true,
      message: 'Inactive user reminder process completed',
      stats: {
        inactiveUsersFound: inactiveUsers.length,
        emailsSent,
        emailsFailed
      }
    });

  } catch (error) {
    console.error('❌ [Inactive Reminder] Error:', error);
    return json({ 
      error: 'Failed to process inactive user reminders',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
