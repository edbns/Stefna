import { Handler } from '@netlify/functions'
import { requireAuth } from './_lib/auth'
import { json } from './_lib/http'
import { neon } from '@neondatabase/serverless'

const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('🗑️ [delete-media] Starting media deletion...');
    console.log('🗑️ [delete-media] Headers:', event.headers);
    
    const { userId } = requireAuth(event.headers.authorization);
    console.log('👤 [delete-media] User authenticated:', userId);
    
    const body = JSON.parse(event.body || '{}');
    const id = body.id || body.mediaId; // Support both field names for compatibility
    console.log('🗑️ [delete-media] Attempting to delete media:', id);
    
    if (!id) {
      return json({ ok: false, error: 'Media ID is required (send as "id" or "mediaId")' }, { status: 400 });
    }

    // Delete the media from the database
    const sql = neon(process.env.NETLIFY_DATABASE_URL!);
    const result = await sql`
      DELETE FROM assets 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;

    if (result.length === 0) {
      console.log('❌ [delete-media] Media not found or access denied:', { id, userId });
      return json({ ok: false, error: 'Media not found or access denied' }, { status: 404 });
    }

    console.log('✅ [delete-media] Media deleted successfully:', { id, userId });
    return json({ 
      ok: true, 
      message: 'Media deleted successfully',
      deletedId: id
    });

  } catch (error: any) {
    console.error('❌ [delete-media] Error:', error);
    
    // Handle authentication errors specifically
    if (error.message?.includes('Missing/invalid Authorization') || 
        error.message?.includes('Token missing userId/sub') ||
        error.message?.includes('Invalid JWT')) {
      return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    return json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export { handler }
