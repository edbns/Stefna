// Netlify Function: Mark Notifications as Read
// Marks notifications as read for the authenticated user

import { Handler } from '@netlify/functions';
import { q } from './_db';
import { requireAuth } from './_lib/auth';



interface MarkReadPayload {
  notificationIds?: string[]; // If not provided, marks all as read
}

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

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { userId } = requireAuth(event.headers.authorization);

    const { notificationIds }: MarkReadPayload = JSON.parse(event.body || '{}');

    // Mark notifications as read using direct SQL
    let updatedCount = 0;
    
    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      const result = await q(`
        UPDATE notifications 
        SET read = true 
        WHERE id = ANY($1) AND user_id = $2
      `, [notificationIds, userId]);
      updatedCount = result.length;
    } else {
      // Mark all notifications as read
      const result = await q(`
        UPDATE notifications 
        SET read = true 
        WHERE user_id = $1 AND read = false
      `, [userId]);
      updatedCount = result.length;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        updatedCount: updatedCount || 0,
        message: notificationIds
          ? `Marked ${updatedCount || 0} notifications as read`
          : `Marked all notifications as read`
      })
    };

  } catch (error) {
    console.error('Mark notifications read error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
