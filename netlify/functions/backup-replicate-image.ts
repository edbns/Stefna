// netlify/functions/backup-replicate-image.ts
// Downloads Replicate images and uploads them to Cloudinary for permanent storage
import { Handler } from '@netlify/functions';

interface BackupRequest {
  replicateUrl: string;
  mediaId: string;
  userId: string;
}

// Main backup function that can be imported and called directly
export async function backupReplicateImage(request: BackupRequest) {
  try {
    const { replicateUrl, mediaId, userId } = request;

    if (!replicateUrl || !mediaId || !userId) {
      return {
        success: false,
        error: 'Missing required fields: replicateUrl, mediaId, userId'
      };
    }

    // Validate that this is actually a Replicate URL
    if (!replicateUrl.includes('replicate.delivery')) {
      return {
        success: false,
        error: 'Invalid URL: not a Replicate delivery URL'
      };
    }

    console.log('🔄 Starting Replicate image backup:', { replicateUrl, mediaId, userId });

    // 1. Download image from Replicate
    console.log('📥 Downloading image from Replicate...');
    const imageResponse = await fetch(replicateUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageSize = imageBuffer.byteLength;
    console.log(`✅ Downloaded image: ${imageSize} bytes`);

    // 2. Upload to Cloudinary using unsigned preset (simpler and more secure)
    console.log('☁️ Uploading to Cloudinary...');
    
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    const publicId = `stefna/replicate-backup/${userId}/${mediaId}`;
    
    // Convert buffer to base64 for upload
    const base64Image = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
    
    const uploadPayload = {
      file: base64Image,
      public_id: publicId,
      upload_preset: 'unsigned_replicate' // Use your preset instead of manual signing
    };

    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uploadPayload)
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Cloudinary upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Cloudinary upload successful:', {
      publicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      bytes: uploadResult.bytes
    });

    // 3. Update database with permanent URL
    console.log('💾 Updating database with permanent URL...');
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.NETLIFY_DATABASE_URL!);
    
    const updateResult = await sql`
      UPDATE media_assets 
      SET final_url = ${uploadResult.secure_url},
          cloudinary_public_id = ${uploadResult.public_id},
          meta = COALESCE(meta, '{}'::jsonb) || jsonb_build_object(
            'backup_completed', true,
            'backup_timestamp', NOW(),
            'original_replicate_url', ${replicateUrl},
            'cloudinary_bytes', ${uploadResult.bytes},
            'cloudinary_folder', 'stefna/replicate-backup',
            'backup_method', 'signed_upload'
          )
      WHERE id = ${mediaId}
      RETURNING id, final_url, cloudinary_public_id
    `;

    if (updateResult.length === 0) {
      throw new Error(`Media asset not found: ${mediaId}`);
    }

    console.log('✅ Database updated successfully:', updateResult[0]);

    return {
      success: true,
      mediaId,
      originalUrl: replicateUrl,
      permanentUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      bytes: uploadResult.bytes
    };

  } catch (error) {
    console.error('❌ Replicate backup failed:', error);
    
    return {
      success: false,
      error: 'Backup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Netlify function handler
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { replicateUrl, mediaId, userId }: BackupRequest = JSON.parse(event.body || '{}');
    
    const result = await backupReplicateImage({ replicateUrl, mediaId, userId });
    
    if (result.success) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(result)
      };
    } else {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(result)
      };
    }

  } catch (error) {
    console.error('❌ Replicate backup failed:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Backup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
