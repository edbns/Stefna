// Netlify Function: Get User Notifications
// Returns notifications for the authenticated user
import { sql } from '../lib/db';
import { requireUser } from '../lib/auth';
export const handler = async (event) => {
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
        // Create notifications table if it doesn't exist
        await sql `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        media_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        read BOOLEAN DEFAULT FALSE,
        metadata JSONB
      )
    `;
        // Build query for notifications
        let query = sql `
      SELECT id, kind, media_id, created_at, read, metadata
      FROM notifications
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;
        // Filter for unread only if requested
        if (unread_only === 'true') {
            query = sql `
        SELECT id, kind, media_id, created_at, read, metadata
        FROM notifications
        WHERE user_id = ${user.id} AND read = FALSE
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${parseInt(offset)}
      `;
        }
        const notifications = await query;
        // Get unread count
        const unreadCountResult = await sql `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ${user.id} AND read = FALSE
    `;
        const unreadCount = unreadCountResult[0]?.count || 0;
        // Format notifications for UI
        const formattedNotifications = notifications.map((notification) => ({
            id: notification.id,
            kind: notification.kind,
            mediaId: notification.media_id,
            createdAt: notification.created_at,
            read: notification.read,
            metadata: notification.metadata || {}
        }));
        console.log(`✅ Returning ${formattedNotifications.length} notifications for user ${user.id}`);
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                ok: true,
                notifications: formattedNotifications,
                unreadCount: parseInt(unreadCount),
                hasMore: formattedNotifications.length >= parseInt(limit)
            })
        };
    }
    catch (error) {
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
};
