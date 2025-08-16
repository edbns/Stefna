import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

function getUserIdFromToken(auth?: string): string | null {
  try {
    if (!auth?.startsWith('Bearer ')) return null;
    const jwt = auth.slice(7);
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
    const id = payload.sub || payload.uid || payload.user_id || payload.userId || payload.id;
    return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
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

  try {
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

    const { assetId, publish } = JSON.parse(event.body || '{}');
    if (!assetId) {
      return { 
        statusCode: 400, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ ok: false, error: 'assetId required' }) 
      };
    }

    try {
      // Update media asset visibility in database
      const result = await sql`
        UPDATE media_assets 
        SET 
          visibility = ${publish ? 'public' : 'private'},
          updated_at = NOW()
        WHERE id = ${assetId} AND user_id = ${userId}
        RETURNING id, visibility, updated_at
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
          message: `Asset ${publish ? 'published' : 'unpublished'} successfully`
        }) 
      };

    } catch (dbError) {
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

  } catch (error) {
    console.error('[togglePublish] error:', error);
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
