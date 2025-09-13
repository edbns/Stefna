import type { Handler } from "@netlify/functions";
import { q, qOne } from './_db';
import { json } from './_lib/http';
import { requireAuth } from './_lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405, headers });
  }

  try {
    // Use standardized authentication helper
    const { userId, email: currentEmail } = requireAuth(event.headers.authorization);
    
    console.log('🔐 Auth context:', { userId, currentEmail });

    // Parse request body
    const { newEmail } = JSON.parse(event.body || '{}');
    
    if (!newEmail) {
      return json({ error: 'New email is required' }, { status: 400, headers });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return json({ error: 'Invalid email format' }, { status: 400, headers });
    }

    // Check if new email is different from current email
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      return json({ error: 'New email must be different from current email' }, { status: 400, headers });
    }

    // Check if new email is already taken by another user
    const existingUser = await qOne(`
      SELECT id FROM users WHERE email = $1 AND id != $2
    `, [newEmail.toLowerCase(), userId]);

    if (existingUser) {
      return json({ error: 'Email is already taken by another user' }, { status: 409, headers });
    }

    // Generate OTP for email change
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await q(`
      INSERT INTO auth_otps (id, email, code, expires_at, created_at, type)
      VALUES ($1, $2, $3, $4, NOW(), 'email_change')
      ON CONFLICT (email, type) 
      DO UPDATE SET 
        code = EXCLUDED.code,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()
    `, [uuidv4(), newEmail.toLowerCase(), otp, expiresAt]);

    // Send OTP email to the NEW email address
    const emailResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: newEmail.toLowerCase(),
        subject: 'Verify your new email address',
        type: 'email_change_otp',
        data: {
          newEmail: newEmail.toLowerCase(),
          currentEmail: currentEmail,
          otp: otp,
          userId: userId
        }
      })
    });

    if (!emailResponse.ok) {
      console.error('Failed to send OTP email');
      return json({ error: 'Failed to send verification email' }, { status: 500, headers });
    }

    console.log(`📧 Email change OTP sent to ${newEmail} for user ${userId}`);

    return json({ 
      success: true, 
      message: 'Verification code sent to your new email address',
      newEmail: newEmail.toLowerCase()
    }, { headers });

  } catch (error) {
    console.error('Failed to request email change OTP:', error);
    return json({ error: 'Failed to send verification code' }, { status: 500, headers });
  }
};
