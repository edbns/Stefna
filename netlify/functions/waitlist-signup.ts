import { Handler } from '@netlify/functions';
import { json } from './_lib/http';
import { q } from './_db';

const waitlistSignup: Handler = async (event) => {
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
    const { email } = JSON.parse(event.body || '{}');

    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    // Add to waitlist (simple insert)
    await q('INSERT INTO waitlist (email, created_at) VALUES ($1, NOW())', [email]);

    console.log(`✅ [Waitlist] New signup: ${email}`);

    // Send confirmation email using the existing email system
    try {
      const emailResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          type: 'waitlist_confirmation',
          subject: 'Get ready to create with AI',
          text: 'Waitlist confirmation email'
        }),
      });

      if (emailResponse.ok) {
        console.log(`📧 [Waitlist] Confirmation email sent to: ${email}`);
      } else {
        console.error(`❌ [Waitlist] Failed to send email to: ${email}`);
      }
    } catch (emailError) {
      console.error('📧 [Waitlist] Email error:', emailError);
      // Don't fail the signup if email fails
    }

    return json({
      success: true,
      message: 'Successfully joined the waitlist! Check your email for confirmation.'
    });

  } catch (error: any) {
    console.error('💥 [Waitlist] Error:', error?.message || error);
    return json({ 
      error: 'Failed to join waitlist',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 });
  }
};

export { waitlistSignup as handler };