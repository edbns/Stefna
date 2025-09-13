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

    // Update user's email
    await q(`
      UPDATE users 
      SET email = $1, updated_at = NOW()
      WHERE id = $2
    `, [newEmail.toLowerCase(), userId]);

    console.log(`✅ Email updated for user ${userId}: ${currentEmail} -> ${newEmail}`);

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
