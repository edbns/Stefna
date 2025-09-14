import type { Handler } from "@netlify/functions";
import { qOne } from './_db';
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🧪 [Test] Sending credit refresh email to:', email);

    // Send test credit refresh email
    const response = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Credits refreshed — let\'s create.',
        type: 'daily_credits_refresh',
        data: { 
          userId: 'test-user',
          resetTime: new Date().toISOString(),
          newBalance: 14
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ [Test] Credit refresh email sent successfully');
      return json({ 
        success: true, 
        message: 'Credit refresh email sent successfully',
        result 
      });
    } else {
      console.error('❌ [Test] Failed to send email:', result);
      return json({ 
        success: false, 
        error: 'Failed to send email',
        details: result 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('💥 [Test] Error:', error);
    return json({ 
      success: false, 
      error: 'Test failed',
      details: error.message 
    }, { status: 500 });
  }
};
