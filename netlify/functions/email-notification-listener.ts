// netlify/functions/process-email-queue.ts
// Processes email queue created by database trigger

import type { Handler } from '@netlify/functions';
import { q, qOne } from './_db';
import { json } from './_lib/http';

const processEmailQueue: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return json({}, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('📧 [Email Queue] Processing pending emails...');

    // Get pending emails from queue
    const pendingEmails = await q(`
      SELECT id, email, type, subject 
      FROM email_queue 
      WHERE status = 'pending' 
      ORDER BY created_at ASC
    `);

    if (!pendingEmails || pendingEmails.length === 0) {
      return json({ 
        success: true, 
        message: 'No pending emails to process',
        processed: 0
      });
    }

    console.log(`📧 [Email Queue] Found ${pendingEmails.length} emails to process...`);

    // Process each email
    const results = await Promise.allSettled(
      pendingEmails.map(async (emailJob: any) => {
        try {
          const emailResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: emailJob.email,
              type: emailJob.type,
              subject: emailJob.subject,
              text: 'Waitlist launch notification'
            }),
          });

          if (emailResponse.ok) {
            // Mark as processed
            await qOne(`
              UPDATE email_queue 
              SET status = 'sent', processed_at = NOW() 
              WHERE id = $1
            `, [emailJob.id]);

            console.log(`✅ [Email Queue] Email sent to: ${emailJob.email}`);
            return { email: emailJob.email, success: true };
          } else {
            // Mark as failed
            await qOne(`
              UPDATE email_queue 
              SET status = 'failed', processed_at = NOW() 
              WHERE id = $1
            `, [emailJob.id]);

            console.error(`❌ [Email Queue] Failed to send to: ${emailJob.email}`);
            return { email: emailJob.email, success: false };
          }
        } catch (error) {
          console.error(`❌ [Email Queue] Error processing ${emailJob.email}:`, error);
          return { email: emailJob.email, success: false };
        }
      })
    );

    // Count results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`✅ [Email Queue] Completed: ${successful} successful, ${failed} failed`);

    return json({
      success: true,
      message: 'Email queue processed',
      stats: {
        total: pendingEmails.length,
        successful,
        failed
      }
    });

  } catch (error: any) {
    console.error('❌ [Email Queue] Error:', error);
    return json({ 
      error: 'Failed to process email queue',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 });
  }
};

export { processEmailQueue as handler };
