import { signedFetch } from '../lib/auth';
import { sessionCache } from './sessionCache';
import { backgroundUploadWithPreview, BackgroundUploadOptions } from './backgroundSync';

// Retry configuration for Cloudinary uploads
const UPLOAD_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000,  // 8 seconds
  backoffMultiplier: 2,
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
      console.error(`❌ Cloudinary upload failed after ${attempt} attempts:`, error);
      throw error;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      UPLOAD_RETRY_CONFIG.baseDelay * Math.pow(UPLOAD_RETRY_CONFIG.backoffMultiplier, attempt - 1),
      UPLOAD_RETRY_CONFIG.maxDelay
    );
    
    console.log(`⚠️ Cloudinary upload attempt ${attempt} failed, retrying in ${delay}ms...`, {
      error: error instanceof Error ? error.message : String(error),
      nextAttempt: attempt + 1,
      delay
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
  ];
  
  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}

export async function prepareSourceAsset(
  activeFileOrUrl: File | string,
  options: BackgroundUploadOptions = {}
) {
  // If it's already a public http(s) URL, skip upload.
  if (typeof activeFileOrUrl === 'string' && /^https?:\/\//i.test(activeFileOrUrl)) {
    const resource_type = /\.(mp4|mov|webm)$/i.test(activeFileOrUrl) ? 'video' : 'image';
    return { url: activeFileOrUrl, resource_type };
  }

  // If it's a blob URL string, convert to File first
  let file: File;
  if (typeof activeFileOrUrl === 'string' && activeFileOrUrl.startsWith('blob:')) {
    const resp = await fetch(activeFileOrUrl);
    const blob = await resp.blob();
    const ext = blob.type.startsWith('image/') ? (blob.type.split('/')[1] || 'png') :
                blob.type.startsWith('video/') ? (blob.type.split('/')[1] || 'mp4') : 'bin';
    file = new File([blob], `source.${ext}`, { type: blob.type || 'application/octet-stream' });
  } else {
    file = activeFileOrUrl as File;
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
      form.append('file', file);
      form.append('timestamp', String(timestamp));
      form.append('signature', signature);
      form.append('api_key', apiKey);
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
      const result = { url: json.secure_url as string, resource_type };
      
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
    form.append('file', file);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('api_key', apiKey);
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
    const result = { url: json.secure_url as string, resource_type };
    
    // Cache the successful upload
    await sessionCache.cacheFileUpload(file, result);
    
    return result;
  };

  // Use retry wrapper for the upload
  return await retryCloudinaryUpload(uploadToCloudinary);
}