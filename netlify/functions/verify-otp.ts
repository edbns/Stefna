import type { Handler } from '@netlify/functions';
import { neonAdmin } from '../lib/neonAdmin';
import { json } from './_lib/http';
import * as jose from 'jose';

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
    const { email, otp } = body;

    if (!email || !otp) {
      return json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // Verify OTP from database
    const { data: otpData, error: otpError } = await neonAdmin
      .from('user_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp', otp)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpData) {
      return json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Mark OTP as used
    await neonAdmin
      .from('user_otps')
      .update({ used: true })
      .eq('id', otpData.id);

    // Check if user exists
    const { data: existingUser } = await neonAdmin
      .from('users')
      .select('id, email, external_id')
      .eq('email', email.toLowerCase())
      .single();

    let userId: string;

    if (existingUser) {
      // User exists, use existing ID
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await neonAdmin
        .from('users')
        .insert({
          email: email.toLowerCase(),
          external_id: email.toLowerCase(), // Use email as external_id for now
          status: 'registered'
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        console.error('❌ Failed to create user:', createError);
        return json({ error: 'Failed to create user account' }, { status: 500 });
      }

      userId = newUser.id;

      // Initialize user credits
      const { data: starterGrant } = await neonAdmin
        .from('app_config')
        .select('value')
        .eq('key', 'starter_grant')
        .single();

      const starterAmount = starterGrant?.value ? parseInt(starterGrant.value) : 30;

      await neonAdmin
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: starterAmount,
          updated_at: new Date().toISOString()
        });

      await neonAdmin
        .from('credits_ledger')
        .insert({
          user_id: userId,
          amount: starterAmount,
          reason: 'starter',
          status: 'granted',
          meta: { reason: 'starter' }
        });

      console.log(`✅ New user created: ${userId} with ${starterAmount} starter credits`);
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    if (!secret) {
      console.error('❌ JWT_SECRET not configured');
      return json({ error: 'Server configuration error' }, { status: 500 });
    }

    const token = await new jose.SignJWT({ 
      sub: userId, 
      email: email.toLowerCase(),
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    return json({
      success: true,
      token,
      user: {
        id: userId,
        email: email.toLowerCase()
      }
    });

  } catch (error: any) {
    console.error('❌ verify-otp error:', error);
    return json({ 
      error: 'Failed to verify OTP',
      details: error.message 
    }, { status: 500 });
  }
};
