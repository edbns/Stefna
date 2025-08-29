import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';

// ---- Database connection ----


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
      const status = publish ? 'public' : 'private';
      let updatedCount = 0;

      // Try ghibli_reaction_media first
      let rows = await q(`
        UPDATE ghibli_reaction_media 
        SET status = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING id
      `, [status, assetId, userId]);
      updatedCount += rows.length;

      // If not found, try emotion_mask_media
      if (updatedCount === 0) {
        rows = await q(`
          UPDATE emotion_mask_media
          SET status = $1, updated_at = NOW()
          WHERE id = $2 AND user_id = $3
          RETURNING id
        `, [status, assetId, userId]);
        updatedCount += rows.length;
      }

      // If not found, try presets_media
      if (updatedCount === 0) {
        rows = await q(`
          UPDATE presets_media
          SET status = $1, updated_at = NOW()
          WHERE id = $2 AND user_id = $3
          RETURNING id
        `, [status, assetId, userId]);
        updatedCount += rows.length;
      }

      // If not found, try custom_prompt_media
      if (updatedCount === 0) {
        rows = await q(`
          UPDATE custom_prompt_media
          SET status = $1, updated_at = NOW()
          WHERE id = $2 AND user_id = $3
          RETURNING id
        `, [status, assetId, userId]);
        updatedCount += rows.length;
      }

      // If not found, try neo_glitch_media
      if (updatedCount === 0) {
        rows = await q(`
          UPDATE neo_glitch_media
          SET status = $1, updated_at = NOW()
          WHERE id = $2 AND user_id = $3
          RETURNING id
        `, [status, assetId, userId]);
        updatedCount += rows.length;
      }

      if (updatedCount === 0) {
        return { 
          statusCode: 404, 
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ ok: false, error: 'Asset not found or not owned by user' }) 
        };
      }

      return { 
        statusCode: 200, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          ok: true, 
          message: `Asset ${publish ? 'published' : 'unpublished'} successfully`,
          updatedCount
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
