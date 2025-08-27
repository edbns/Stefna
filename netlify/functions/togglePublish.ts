import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

// ---- Database connection ----
const prisma = new PrismaClient();

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
      // Update media asset visibility in database using Prisma
      // Check all new dedicated tables for the asset
      let result;
      
      // Try ghibli_reaction_media first
      result = await prisma.ghibliReactionMedia.updateMany({
        where: { 
          id: assetId, 
          userId: userId 
        },
        data: { 
          status: publish ? 'public' : 'private'
        }
      });
      
      // If not found, try emotion_mask_media
      if (result.count === 0) {
        result = await prisma.emotionMaskMedia.updateMany({
          where: { 
            id: assetId, 
            userId: userId 
          },
          data: { 
            status: publish ? 'public' : 'private'
          }
        });
      }
      
      // If not found, try presets_media
      if (result.count === 0) {
        result = await prisma.presetsMedia.updateMany({
          where: { 
            id: assetId, 
            userId: userId 
          },
          data: { 
            status: publish ? 'public' : 'private'
          }
        });
      }
      
      // If not found, try custom_prompt_media
      if (result.count === 0) {
        result = await prisma.customPromptMedia.updateMany({
          where: { 
            id: assetId, 
            userId: userId 
          },
          data: { 
            status: publish ? 'public' : 'private'
          }
        });
      }
      
      // If not found, try neo_glitch_media
      if (result.count === 0) {
        result = await prisma.neoGlitchMedia.updateMany({
          where: { 
            id: assetId, 
            userId: userId 
          },
          data: { 
            status: publish ? 'public' : 'private'
          }
        });
      }

      if (result.count === 0) {
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
          updatedCount: result.count
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
