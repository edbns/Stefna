// Netlify Function: Get User Notifications
// Returns notifications for the authenticated user

import { Handler } from '@netlify/functions';
import { supabase } from '../lib/supabaseAdmin';
import jwt from 'jsonwebtoken';

function getUserIdFromToken(auth?: string): string | null {
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.userId || decoded.sub;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const userId = getUserIdFromToken(event.headers.authorization);
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const { limit = '20', offset = '0', unread_only = 'false' } = event.queryStringParameters || {};

    // Build query
    let query = supabase
      .from('notifications')
      .select(`
        id,
        kind,
        media_id,
        created_at,
        read,
        metadata
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Filter for unread only if requested
    if (unread_only === 'true') {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch notifications' })
      };
    }

    // Get unread count
    const { data: unreadCountData, error: countError } = await supabase
      .rpc('get_unread_notification_count', { target_user_id: userId });

    const unreadCount = countError ? 0 : (unreadCountData || 0);

    // Format notifications for UI
    const formattedNotifications = notifications?.map(notification => ({
      id: notification.id,
      kind: notification.kind,
      mediaId: notification.media_id,
      createdAt: notification.created_at,
      read: notification.read,
      message: formatNotificationMessage(notification),
      metadata: notification.metadata
    })) || [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        notifications: formattedNotifications,
        unreadCount,
        hasMore: notifications?.length === parseInt(limit)
      })
    };

  } catch (error) {
    console.error('Get notifications error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

function formatNotificationMessage(notification: any): string {
  switch (notification.kind) {
    case 'remix':
      const count = notification.metadata?.count || 1;
      if (count === 1) {
        return 'Your piece was remixed';
      } else {
        return `${count} remixes today`;
      }
    case 'like':
      return 'Someone liked your creation';
    case 'share':
      return 'Your creation was shared';
    case 'system':
      return notification.metadata?.message || 'System notification';
    default:
      return 'New notification';
  }
}
