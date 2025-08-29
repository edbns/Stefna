// Netlify Function: Get User Notifications
// Returns notifications for the authenticated user

import { Handler } from '@netlify/functions';
import { q, qCount } from './_db';
import { requireUser } from './_lib/auth';

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Use the new robust auth helper
    const user = await requireUser(event);
    console.log('✅ User authenticated for notifications:', user.id);

    const { limit = '20', offset = '0', unread_only = 'false' } = event.queryStringParameters || {};

    try {
      // Build query for notifications
      let whereClause = '';
      let params: any[] = [user.id];
      
      if (unread_only === 'true') {
        whereClause = 'AND read = false';
      }

      const notifications = await q(`
        SELECT id, type, title, message, read, created_at
        FROM notifications 
        WHERE user_id = $1 ${whereClause}
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [user.id, parseInt(limit), parseInt(offset)]);

      // Get unread count
      const unreadCountResult = await qCount(`
        SELECT COUNT(*) as count
        FROM notifications 
        WHERE user_id = $1 AND read = false
      `, [user.id]);
      
      const unreadCount = unreadCountResult;

      // Format notifications for UI
      const formattedNotifications = notifications.map((notification: any) => ({
        id: notification.id,
        kind: notification.type,
        mediaId: null, // Notifications don't have media_id in current schema
        createdAt: notification.created_at,
        read: notification.read,
        metadata: {} // No metadata field in current schema
      }));

      console.log(`✅ Returning ${formattedNotifications.length} notifications for user ${user.id}`);

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          ok: true,
          notifications: formattedNotifications,
          unreadCount: unreadCount,
          hasMore: formattedNotifications.length >= parseInt(limit)
        })
      };

    } catch (dbError) {
      console.error('❌ Database error in get-notifications:', dbError);
      
      // Return empty notifications instead of error for better UX
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          ok: true,
          notifications: [],
          unreadCount: 0,
          hasMore: false,
          error: 'Failed to load notifications'
        })
      };
    }

  } catch (error: any) {
    console.error('❌ Error in get-notifications:', error);
    
    // Return empty notifications instead of error for better UX
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: true,
        notifications: [],
        unreadCount: 0,
        hasMore: false,
        error: error.message || 'Failed to load notifications'
      })
    };
  }
}
