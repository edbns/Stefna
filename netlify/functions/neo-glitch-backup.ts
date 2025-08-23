// Neo Tokyo Glitch Cloudinary Backup Function
// Backs up Replicate URLs to Cloudinary for permanent storage
// Updates the glitch record with the permanent Cloudinary URL

import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from './lib/auth';
import { json } from './_lib/http';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Authenticate user
    const { sub: userId } = requireAuth(event);
    console.log('🎭 [NeoGlitch] User authenticated for backup:', userId);

    const body = JSON.parse(event.body || '{}');
    const { glitchId } = body;

    // Validate required fields
    if (!glitchId) {
      return json({ 
        error: 'Missing required field: glitchId is required' 
      }, { status: 400 });
    }

    // Validate Cloudinary configuration
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error('❌ [NeoGlitch] Cloudinary configuration missing');
      return json({ 
        error: 'Cloudinary not configured' 
      }, { status: 500 });
    }

    console.log('🔄 [NeoGlitch] Starting Cloudinary backup for glitch:', glitchId);

    const sql = neon(process.env.NETLIFY_DATABASE_URL!);

    // Get the glitch record
    const glitchRecord = await sql`
      SELECT id, user_id, status, prompt, preset_key, replicate_url, cloudinary_url, meta
      FROM media_assets_glitch 
      WHERE id = ${glitchId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (!glitchRecord || glitchRecord.length === 0) {
      return json({ 
        error: 'Glitch record not found or access denied' 
      }, { status: 404 });
    }

    const record = glitchRecord[0];
    console.log('🎭 [NeoGlitch] Found glitch record:', {
      id: record.id,
      status: record.status,
      hasReplicateUrl: !!record.replicate_url,
      hasCloudinaryUrl: !!record.cloudinary_url
    });

    // Check if already backed up
    if (record.cloudinary_url) {
      console.log('✅ [NeoGlitch] Already backed up to Cloudinary:', record.cloudinary_url);
      return json({
        id: record.id,
        status: 'completed',
        cloudinaryUrl: record.cloudinary_url,
        replicateUrl: record.replicate_url,
        message: 'Already backed up to Cloudinary'
      });
    }

    // Check if we have a Replicate URL to backup
    if (!record.replicate_url) {
      console.error('❌ [NeoGlitch] No Replicate URL to backup');
      return json({ 
        error: 'No Replicate URL found for backup' 
      }, { status: 400 });
    }

    // Check if status is completed
    if (record.status !== 'completed') {
      console.error('❌ [NeoGlitch] Generation not completed yet, status:', record.status);
      return json({ 
        error: 'Generation not completed yet' 
      }, { status: 400 });
    }

    console.log('🔄 [NeoGlitch] Starting Cloudinary backup from Replicate URL:', record.replicate_url);

    // Generate a unique folder name for this glitch generation
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const folder = `neo-glitch/${timestamp}/${record.id}`;
    const publicId = `${folder}/glitch`;

    // Prepare Cloudinary upload parameters
    const uploadParams = new URLSearchParams({
      file: record.replicate_url,
      public_id: publicId,
      folder: folder,
      resource_type: 'image',
      overwrite: false,
      invalidate: true
    });

    // Create authorization signature
    const signature = await generateCloudinarySignature(uploadParams.toString());
    uploadParams.append('signature', signature);
    uploadParams.append('api_key', CLOUDINARY_API_KEY);
    uploadParams.append('timestamp', Math.floor(Date.now() / 1000).toString());

    console.log('🔄 [NeoGlitch] Uploading to Cloudinary folder:', folder);

    // Upload to Cloudinary
    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: uploadParams
    });

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('❌ [NeoGlitch] Cloudinary upload failed:', cloudinaryResponse.status, errorText);
      
      // Mark as failed
      await sql`
        UPDATE media_assets_glitch 
        SET 
          status = 'failed',
          meta = jsonb_set(
            COALESCE(meta, '{}'::jsonb), 
            '{error}', 
            ${`Cloudinary backup failed: ${cloudinaryResponse.status}`}::jsonb
          ),
          updated_at = NOW()
        WHERE id = ${glitchId}
      `;

      return json({ 
        error: 'Cloudinary backup failed',
        details: errorText
      }, { status: cloudinaryResponse.status });
    }

    const cloudinaryResult = await cloudinaryResponse.json();
    console.log('✅ [NeoGlitch] Cloudinary upload successful:', {
      publicId: cloudinaryResult.public_id,
      url: cloudinaryResult.secure_url,
      format: cloudinaryResult.format
    });

    // Update the glitch record with Cloudinary URL
    await sql`
      UPDATE media_assets_glitch 
      SET 
        cloudinary_url = ${cloudinaryResult.secure_url},
        status = 'completed',
        updated_at = NOW()
      WHERE id = ${glitchId}
    `;

    console.log('✅ [NeoGlitch] Glitch record updated with Cloudinary URL');

    // Return the completed result
    return json({
      id: record.id,
      status: 'completed',
      cloudinaryUrl: cloudinaryResult.secure_url,
      replicateUrl: record.replicate_url,
      publicId: cloudinaryResult.public_id,
      message: 'Successfully backed up to Cloudinary'
    });

  } catch (error: any) {
    console.error('💥 [NeoGlitch] Backup error:', error);
    
    if (error.message === 'NO_BEARER') {
      return json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    return json({ 
      error: 'BACKUP_FAILED',
      message: error.message 
    }, { status: 500 });
  }
};

/**
 * Generate Cloudinary signature for secure upload
 */
async function generateCloudinarySignature(params: string): Promise<string> {
  // For now, we'll use a simple approach
  // In production, you might want to use a more secure method
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = `${timestamp}${CLOUDINARY_API_SECRET}`;
  
  // Simple hash for demo purposes
  const encoder = new TextEncoder();
  const data = encoder.encode(signature);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex.substring(0, 8); // Return first 8 characters
}
