// Netlify Function: Anonymous Remix Notifications
// Sends private notifications when media is remixed

import { Handler } from '@netlify/functions';
import { supabaseAdminAdmin } from '../lib/supabaseAdminAdmin';

interface NotifyRemixPayload {
  parentId: string;
  childId: string;
  createdAt: string;
}

interface Notification {
  id: string;
  user_id: string;
  kind: 'remix';
  media_id: string;
  created_at: string;
  read: boolean;
  metadata?: {
    child_id?: string;
    count?: number;
  };
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { parentId, childId, createdAt }: NotifyRemixPayload = JSON.parse(event.body || '{}');

    if (!parentId || !childId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'parentId and childId are required' })
      };
    }

    // 1. Get the parent media to find the owner
    const { data: parentMedia, error: parentError } = await supabaseAdmin
      .from('media_assets')
      .select('user_id, remix_count')
      .eq('id', parentId)
      .single();

    if (parentError || !parentMedia) {
      console.error('Failed to find parent media:', parentError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Parent media not found' })
      };
    }

    // 2. Increment remix count (this should also be handled by the database trigger)
    const { error: updateError } = await supabaseAdmin
      .from('media_assets')
      .update({ remix_count: (parentMedia.remix_count || 0) + 1 })
      .eq('id', parentId);

    if (updateError) {
      console.warn('Failed to update remix count:', updateError);
    }

    // 3. Check if there's already a recent remix notification for this user today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingNotifications } = await supabaseAdmin
      .from('notifications')
      .select('id, metadata')
      .eq('user_id', parentMedia.user_id)
      .eq('kind', 'remix')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    // 4. If there's already a notification today, update the count instead of creating a new one
    if (existingNotifications && existingNotifications.length > 0) {
      const existingNotification = existingNotifications[0];
      const currentCount = existingNotification.metadata?.count || 1;
      
      const { error: updateNotificationError } = await supabaseAdmin
        .from('notifications')
        .update({
          metadata: {
            ...existingNotification.metadata,
            count: currentCount + 1,
            latest_child_id: childId
          },
          created_at: createdAt // Update timestamp to latest remix
        })
        .eq('id', existingNotification.id);

      if (updateNotificationError) {
        console.error('Failed to update notification:', updateNotificationError);
      } else {
        console.log(`Updated remix notification count to ${currentCount + 1} for user ${parentMedia.user_id}`);
      }
    } else {
      // 5. Create a new notification
      const notification: Omit<Notification, 'id'> = {
        user_id: parentMedia.user_id,
        kind: 'remix',
        media_id: childId, // Point to the new remix
        created_at: createdAt,
        read: false,
        metadata: {
          child_id: childId,
          count: 1
        }
      };

      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert([notification]);

      if (insertError) {
        console.error('Failed to create notification:', insertError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to create notification' })
        };
      }

      console.log(`Created remix notification for user ${parentMedia.user_id}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Remix notification sent',
        parentUserId: parentMedia.user_id
      })
    };

  } catch (error) {
    console.error('Remix notification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
