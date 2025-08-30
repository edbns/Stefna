// Re-export cloudinary functions for backward compatibility
export { uploadToCloudinary, uploadAvatarToCloudinary } from './cloudinaryUpload';
export { cloudinaryUrl } from './cloudinary';

// Utility function to get cloudinary URL from environment
export function cloudinaryUrlFromEnv(publicId: string, mediaType: 'image' | 'video' = 'image') {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('VITE_CLOUDINARY_CLOUD_NAME environment variable is not set');
  }
  
  const base = `https://res.cloudinary.com/${cloudName}`;
  return mediaType === 'video'
    ? `${base}/video/upload/${publicId}.mp4`
    : `${base}/image/upload/${publicId}.jpg`;
}
