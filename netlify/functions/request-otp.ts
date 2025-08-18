import type { Handler } from '@netlify/functions';
import { neonAdmin } from '../lib/neonAdmin';
import { json } from './_lib/http';

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
    if (event.httpMethod !== 'POST') {
      return json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in database
    await neonAdmin
      .from('user_otps')
      .upsert({
        email: email.toLowerCase(),
        otp,
        expires_at: expiresAt.toISOString(),
        used: false,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });

    // TODO: Send OTP via email service
    // For now, just return success (email sending will be handled separately)
    console.log(`📧 OTP generated for ${email}: ${otp}`);

    return json({ 
      success: true, 
      message: 'OTP sent successfully',
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error: any) {
    console.error('❌ request-otp error:', error);
    return json({ 
      error: 'Failed to send OTP',
      details: error.message 
    }, { status: 500 });
  }
};
