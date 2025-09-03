import { signedFetch } from '../lib/auth';
import { sessionCache } from './sessionCache';
import { backgroundUploadWithPreview, BackgroundUploadOptions } from './backgroundSync';

// Convert data URL to Blob
function dataURLtoBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(parts[1] || '');
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}

function validateFileOrThrow(file: File) {
  if (!file) throw new Error('Cannot upload empty or invalid file');
  if (!('size' in file) || file.size === 0) throw new Error('Cannot upload empty file');
  if (!file.type) throw new Error('File type is missing');
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    throw new Error('Only image or video files are supported');
  }
}

// Retry configuration for Cloudinary uploads
const UPLOAD_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000,  // 8 seconds
  backoffMultiplier: 2,
  jitterRange: 300, // 0-300ms random jitter
};

// Retry wrapper for Cloudinary upload with exponential backoff
async function retryCloudinaryUpload(
  uploadFn: () => Promise<any>,
  attempt: number = 1,
  lastError?: Error
): Promise<any> {
  try {
    return await uploadFn();
  } catch (error) {
    const isLastAttempt = attempt >= UPLOAD_RETRY_CONFIG.maxAttempts;
    const isRetryableError = isRetryableUploadError(error);
    
    if (isLastAttempt || !isRetryableError) {
      // Enhanced final error logging
      if (isLastAttempt) {
        console.error(`❌ FINAL Cloudinary upload failure (attempt ${attempt}/${UPLOAD_RETRY_CONFIG.maxAttempts}):`, {
          error: error instanceof Error ? error.message : String(error),
          attempt,
          maxAttempts: UPLOAD_RETRY_CONFIG.maxAttempts,
          isRetryable: isRetryableError,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error(`❌ Non-retryable Cloudinary upload error (attempt ${attempt}):`, {
          error: error instanceof Error ? error.message : String(error),
          reason: 'Fatal error detected - skipping retries',
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
    
    // Calculate delay with exponential backoff + jitter
    const baseDelay = UPLOAD_RETRY_CONFIG.baseDelay * Math.pow(UPLOAD_RETRY_CONFIG.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * UPLOAD_RETRY_CONFIG.jitterRange;
    const delay = Math.min(baseDelay + jitter, UPLOAD_RETRY_CONFIG.maxDelay);
    
    console.log(`⚠️ Cloudinary upload attempt ${attempt}/${UPLOAD_RETRY_CONFIG.maxAttempts} failed, retrying in ${Math.round(delay)}ms...`, {
      error: error instanceof Error ? error.message : String(error),
      nextAttempt: attempt + 1,
      baseDelay: Math.round(baseDelay),
      jitter: Math.round(jitter),
      finalDelay: Math.round(delay),
      timestamp: new Date().toISOString()
    });
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Recursive retry
    return retryCloudinaryUpload(uploadFn, attempt + 1, error instanceof Error ? error : new Error(String(error)));
  }
}

// Determine if an upload error is retryable
function isRetryableUploadError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || String(error);
  const errorName = error.name || '';
  
  // Non-retryable patterns (fatal errors)
  const nonRetryablePatterns = [
    /invalid signature/i,
    /unsupported file/i,
    /file too large/i,
    /invalid preset/i,
    /authentication failed/i,
    /unauthorized/i,
    /forbidden/i,
    /not found/i,
    /bad request/i,
    /invalid api key/i,
    /quota exceeded/i,
    /rate limit exceeded/i,
  ];
  
  // Check for fatal errors first
  if (nonRetryablePatterns.some(pattern => pattern.test(errorMessage))) {
    console.log(`🚫 Fatal error detected, skipping retries:`, errorMessage);
    return false;
  }
  
  // Retry on network errors, timeouts, and temporary Cloudinary issues
  const retryablePatterns = [
    /timeout/i,
    /network/i,
    /fetch/i,
    /abort/i,
    /cloudinary/i,
    /temporary/i,
    /rate limit/i,
    /server error/i,
    /502/i,
    /503/i,
    /504/i,
    /connection/i,
    /econnreset/i,
    /enotfound/i,
  ];
  
  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}

export async function prepareSourceAsset(
  activeFileOrUrl: File | string,
  options: BackgroundUploadOptions = {}
) {
  // Ensure session cache is initialized
  if (!sessionCache['isInitialized']) {
    await sessionCache.init();
  }

  // If it's already a public http(s) URL, skip upload.
  if (typeof activeFileOrUrl === 'string' && /^https?:\/\//i.test(activeFileOrUrl)) {
    const resource_type = /\.(mp4|mov|webm)$/i.test(activeFileOrUrl) ? 'video' : 'image';
    return { url: activeFileOrUrl, resource_type };
  }

  // If it's a blob URL string, convert to File first
  let file: File;
  if (typeof activeFileOrUrl === 'string' && (activeFileOrUrl.startsWith('blob:') || activeFileOrUrl.startsWith('data:'))) {
    let blob: Blob;
    if (activeFileOrUrl.startsWith('data:')) {
      blob = dataURLtoBlob(activeFileOrUrl);
    } else {
      const resp = await fetch(activeFileOrUrl);
      blob = await resp.blob();
    }
    // Normalize unknown/empty types to safe defaults Cloudinary accepts
    let mime = blob.type;
    if (!mime || mime === 'application/octet-stream') {
      // Assume image if unknown (most previews are images)
      mime = 'image/png';
    }
    let ext: string;
    if (mime.startsWith('image/')) {
      ext = (mime.split('/')[1] || 'png').toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
    } else if (mime.startsWith('video/')) {
      ext = (mime.split('/')[1] || 'mp4').toLowerCase();
    } else {
      // Fallback to image/png to avoid .bin errors
      mime = 'image/png';
      ext = 'png';
    }
    file = new File([blob], `source.${ext}`, { type: mime });
    validateFileOrThrow(file);
  } else {
    file = activeFileOrUrl as File;
    validateFileOrThrow(file);
  }

  // Check cache first
  const cachedResult = await sessionCache.getCachedUpload(file);
  if (cachedResult) {
    console.log('💾 Using cached upload result for:', file.name);
    return cachedResult;
  }

  // If background sync is requested, use it
  if (options.showPreviewImmediately) {
    console.log('⚡ Starting background upload with immediate preview for:', file.name);
    
    const uploadFn = async () => {
      // Signed params
      const signRes = await signedFetch('/.netlify/functions/cloudinary-sign', { 
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ folder: 'stefna/sources' })
      });
      const { timestamp, signature, apiKey, cloudName, folder, upload_preset } = await signRes.json();

      const form = new FormData();
      console.log('[uploading] file:', { name: file.name, size: file.size, type: file.type });
      form.append('file', file);
      form.append('timestamp', String(timestamp));
      form.append('signature', signature);
      form.append('api_key', apiKey);
      // Prefer upload preset if provided (handles whitelisting and transformation)
      if (folder) form.append('folder', folder);
      if (upload_preset) form.append('upload_preset', upload_preset);

      const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: form,
      });

      const json = await up.json().catch(() => ({} as any));
      if (!up.ok) {
        throw new Error(`Cloudinary upload failed: ${json.error?.message || up.statusText || 'Unknown error'}`);
      }

      const resource_type = json.resource_type;
      const result = { 
        url: json.secure_url as string, 
        resource_type,
        width: json.width as number,
        height: json.height as number
      };
      
      // Cache the successful upload
      await sessionCache.cacheFileUpload(file, result);
      
      return result;
    };

    // Start background upload with retry
    const { previewUrl, uploadPromise } = await backgroundUploadWithPreview(file, uploadFn, options);
    
    // Return preview immediately, but also wait for actual upload
    const result = await uploadPromise;
    
    return result;
  }

  // Standard upload with retry (existing logic)
  const uploadToCloudinary = async () => {
  // Signed params
  const signRes = await signedFetch('/.netlify/functions/cloudinary-sign', { 
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ folder: 'stefna/sources' })
  });
  const { timestamp, signature, apiKey, cloudName, folder, upload_preset } = await signRes.json();

  const form = new FormData();
  console.log('[uploading] file:', { name: file.name, size: file.size, type: file.type });
  form.append('file', file);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('api_key', apiKey);
  // Prefer upload preset if provided
  if (folder) form.append('folder', folder);
  if (upload_preset) form.append('upload_preset', upload_preset);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: form,
  });

  // Better 400 debug
  const json = await up.json().catch(() => ({} as any));
  if (!up.ok) {
    console.error('Cloudinary upload failed:', json);
      throw new Error(`Cloudinary upload failed: ${json.error?.message || up.statusText || 'Unknown error'}`);
    }

    const resource_type = json.resource_type;
    const result = { 
      url: json.secure_url as string, 
      resource_type,
      width: json.width as number,
      height: json.height as number
    };
    
    // Cache the successful upload
    await sessionCache.cacheFileUpload(file, result);
    
    return result;
  };

  // Use retry wrapper for the upload
  return await retryCloudinaryUpload(uploadToCloudinary);
}