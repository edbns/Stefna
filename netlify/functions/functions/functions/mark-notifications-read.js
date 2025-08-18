// Netlify Function: Mark Notifications as Read
// Marks notifications as read for the authenticated user
import { neonAdmin } from '../lib/neonAdmin';
import jwt from 'jsonwebtoken';
function getUserIdFromToken(auth) {
    if (!auth?.startsWith('Bearer '))
        return null;
    try {
        const token = auth.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId || decoded.sub;
    }
    catch {
        return null;
    }
}
export const handler = async (event) => {
    try {
        if (event.httpMethod !== 'POST') {
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
        const { notificationIds } = JSON.parse(event.body || '{}');
        // Use the database function to mark notifications as read
        const { data: updatedCount, error } = await neonAdmin
            .rpc('mark_notifications_read', {
            target_user_id: userId,
            notification_ids: notificationIds || null
        });
        if (error) {
            console.error('Failed to mark notifications as read:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to mark notifications as read' })
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                updatedCount: updatedCount || 0,
                message: notificationIds
                    ? `Marked ${updatedCount || 0} notifications as read`
                    : `Marked all notifications as read`
            })
        };
    }
    catch (error) {
        console.error('Mark notifications read error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
