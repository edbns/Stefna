// src/lib/upload.ts
import { uploadToCloudinary } from './cloudinaryUpload';
import { useIntentQueue } from '../state/intentQueue';
import { kickRunIfReady } from '../runner/kick';
import authService from '../services/authService';

export async function handleUploadSelectedFile(file: File): Promise<string> {
  console.info('📤 Starting upload for file:', file.name);
  
  try {
    // Upload to Cloudinary - this returns secure_url (HTTPS)
    const result = await uploadToCloudinary(file, `users/${authService.getCurrentUser()?.id || 'me'}`);
    const secureUrl = result.secure_url;
    
    console.info('📤 Upload successful, secure_url:', secureUrl);
    
    // Verify we have HTTPS URL from Cloudinary
    if (!secureUrl || !secureUrl.startsWith('https://')) {
      throw new Error(`Invalid secure_url from Cloudinary: ${secureUrl}`);
    }
    
    // Set the source URL in the intent queue
    const { setSourceUrl } = useIntentQueue.getState();
    setSourceUrl(secureUrl);
    
    // Kick on next microtask so state is settled (prevents race conditions)
    queueMicrotask(() => { 
      void kickRunIfReady(); 
    });
    
    return secureUrl;
  } catch (error) {
    console.error('📤 Upload failed:', error);
    throw error;
  }
}

// Helper to check if we need to upload
export function needsUpload(): boolean {
  const { sourceUrl } = useIntentQueue.getState();
  return !sourceUrl || !/^https?:\/\//.test(sourceUrl);
}

// Helper to clear source (e.g., when user wants to upload a new file)
export function clearSource(): void {
  const { setSourceUrl } = useIntentQueue.getState();
  setSourceUrl(null);
}
