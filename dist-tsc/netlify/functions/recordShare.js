import { neon } from '@neondatabase/serverless';
// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL);
function getUserIdFromToken(auth) {
    try {
        if (!auth?.startsWith('Bearer '))
            return null;
        const jwt = auth.slice(7);
        const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
        const id = payload.sub || payload.uid || payload.user_id || payload.userId || payload.id;
        return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
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
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ ok: false, error: 'Method not allowed' })
            };
        }
        const body = JSON.parse(event.body || '{}');
        // Auth check
        const userId = getUserIdFromToken(event.headers.authorization);
        if (!userId) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ ok: false, error: 'Unauthorized' })
            };
        }
        const { asset_id, shareToFeed, allowRemix } = body;
        if (!asset_id) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ ok: false, error: 'asset_id required' })
            };
        }
        const is_public = !!shareToFeed;
        const allow_remix = !!shareToFeed && !!allowRemix;
        try {
            // Update media asset in database
            const result = await sql `
        UPDATE media_assets 
        SET 
          visibility = ${is_public ? 'public' : 'private'},
          allow_remix = ${allow_remix},
          updated_at = NOW()
        WHERE id = ${asset_id} AND user_id = ${userId}
        RETURNING id, visibility, allow_remix, updated_at
      `;
            if (result.length === 0) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({ ok: false, error: 'Asset not found or not owned by user' })
                };
            }
            const updatedAsset = result[0];
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    ok: true,
                    asset: updatedAsset,
                    message: `Asset ${is_public ? 'published' : 'unpublished'} successfully`
                })
            };
        }
        catch (dbError) {
            console.error('Database error:', dbError);
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ ok: false, error: 'Database update failed' })
            };
        }
    }
    catch (error) {
        console.error('[recordShare] error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ ok: false, error: 'Internal server error' })
        };
    }
};
