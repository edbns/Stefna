// src/services/uploadSource.ts
import { uploadToCloudinary } from '../lib/cloudinaryUtils'
import { UserMediaItem as UserMedia } from '../types/media'

type Source = { file?: File; url?: string }

export async function uploadSourceToCloudinary(src: Source) {
  const UPLOAD_TIMEOUT = 120000 // 2 minutes for large files
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB limit

  // 1) prefer the original File object
  const isFile = !!src.file
  if (!isFile && src.url && (src.url.startsWith('blob:') || src.url.startsWith('data:'))) {
    // Borrow the last user-selected file if available
    const f = window.__lastSelectedFile as File | undefined
    if (f) {
      console.warn('uploadSource: blob URL detected, falling back to last selected file')
      src = { file: f }
    } else {
      throw new Error('Pass the original File, not a blob/data URL')
    }
  }

  // 2) Validate file size if it's a File object
  if (isFile && src.file) {
    if (src.file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${(src.file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    console.log(`📁 Uploading file: ${src.file.name} (${(src.file.size / 1024 / 1024).toFixed(1)}MB)`);
  }

  // 3) get a fresh signature
  const { signedFetch } = await import('../lib/auth')
  const sign = await signedFetch('/.netlify/functions/cloudinary-sign', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ folder: 'stefna/sources' }),
  }).then(r => r.json())

  const form = new FormData()
  form.append('timestamp', String(sign.timestamp))
  form.append('folder', sign.folder)
  form.append('api_key', sign.api_key)
  form.append('signature', sign.signature)

  // 4) File → binary upload (best). HTTP(S) → remote URL (also fine).
  if (isFile) form.append('file', src.file!)
  else form.append('file', src.url!) // must be https

  // 5) Upload with timeout and retry logic
  let lastError: Error | null = null;
  const maxRetries = 2;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`☁️ [Upload] Attempt ${attempt}/${maxRetries} - Starting Cloudinary upload...`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`⏰ [Upload] Attempt ${attempt} timed out after ${UPLOAD_TIMEOUT/1000}s`);
      }, UPLOAD_TIMEOUT);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Optional dev fallback to unsigned preset to keep you moving
      if (!res.ok) {
        const text = await res.text()
        if (/Invalid Signature/.test(text) && import.meta.env.DEV) {
          console.log('🔄 [Upload] Using dev fallback with unsigned preset...');
          const fd = new FormData()
          fd.append('upload_preset', import.meta.env.VITE_CLD_UNSIGNED_PRESET || '') // e.g. "unsigned-dev-sources"
          if (isFile) fd.append('file', src.file!)
          else fd.append('file', src.url!)
          
          const fallbackRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`, { 
            method: 'POST', 
            body: fd,
            signal: controller.signal
          });
          
          if (fallbackRes.ok) {
            const fallbackJson = await fallbackRes.json();
            console.log('✅ [Upload] Dev fallback successful');
            return { secureUrl: fallbackJson.secure_url as string, publicId: fallbackJson.public_id as string };
          } else {
            throw new Error(`Dev fallback failed: ${fallbackRes.status} ${fallbackRes.statusText}`);
          }
        } else {
          throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} - ${text}`);
        }
      }

      const json = await res.json()
      console.log('✅ [Upload] Cloudinary upload successful:', {
        publicId: json.public_id,
        size: json.bytes ? `${(json.bytes / 1024 / 1024).toFixed(1)}MB` : 'unknown',
        dimensions: json.width && json.height ? `${json.width}x${json.height}` : 'unknown'
      });
      
      return { secureUrl: json.secure_url as string, publicId: json.public_id as string }
      
    } catch (error: any) {
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.error(`⏰ [Upload] Attempt ${attempt} timed out after ${UPLOAD_TIMEOUT/1000}s`);
        if (attempt < maxRetries) {
          console.log(`🔄 [Upload] Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        } else {
          throw new Error(`Upload timed out after ${maxRetries} attempts. Please try again with a smaller file or check your connection.`);
        }
      }
      
      console.error(`❌ [Upload] Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`🔄 [Upload] Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      } else {
        throw new Error(`Upload failed after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new Error('Upload failed for unknown reason');
}
