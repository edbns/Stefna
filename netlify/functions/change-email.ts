import type { Handler } from "@netlify/functions";
import { q, qOne } from './_db';
import { json } from './_lib/http';
import { requireAuth } from './_lib/auth';

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
    const { newEmail, otp } = JSON.parse(event.body || '{}');
    
    if (!newEmail) {
      return json({ error: 'New email is required' }, { status: 400, headers });
    }

    if (!otp) {
      return json({ error: 'Verification code is required' }, { status: 400, headers });
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

    // Verify OTP for email change
    const otpRecord = await qOne(`
      SELECT id, expires_at FROM auth_otps 
      WHERE email = $1 AND code = $2 AND type = 'email_change' 
      ORDER BY created_at DESC LIMIT 1
    `, [newEmail.toLowerCase(), otp]);

    if (!otpRecord) {
      return json({ error: 'Invalid verification code' }, { status: 400, headers });
    }

    // Check if OTP has expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    if (now > expiresAt) {
      return json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400, headers });
    }

    // Delete the used OTP
    await q(`
      DELETE FROM auth_otps WHERE id = $1
    `, [otpRecord.id]);

    // Update user's email
    await q(`
      UPDATE users 
      SET email = $1, updated_at = NOW()
      WHERE id = $2
    `, [newEmail.toLowerCase(), userId]);

    console.log(`✅ Email updated for user ${userId}: ${currentEmail} -> ${newEmail}`);

    // Send notification email to both old and new email addresses
    try {
      // Notify old email address about the change
      await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: currentEmail,
          subject: 'Your email address has been changed',
          type: 'email_change_notification',
          data: {
            oldEmail: currentEmail,
            newEmail: newEmail.toLowerCase(),
            userId: userId,
            changeTime: new Date().toISOString()
          }
        })
      });

      // Notify new email address about the change
      await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newEmail.toLowerCase(),
          subject: 'Your email address has been updated',
          type: 'email_change_confirmation',
          data: {
            oldEmail: currentEmail,
            newEmail: newEmail.toLowerCase(),
            userId: userId,
            changeTime: new Date().toISOString()
          }
        })
      });

      console.log(`📧 Email change notifications sent to both addresses`);
    } catch (emailError) {
      // Don't fail the email change if notification fails
      console.warn('⚠️ Failed to send email change notifications:', emailError);
    }

    return json({ 
      success: true, 
      message: 'Email updated successfully',
      newEmail: newEmail.toLowerCase()
    }, { headers });

  } catch (error) {
    console.error('Failed to update email:', error);
    return json({ error: 'Failed to update email' }, { status: 500, headers });
  }
};
