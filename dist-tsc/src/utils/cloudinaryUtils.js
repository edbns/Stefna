/**
 * Construct Cloudinary URL for media rendering
 * @param publicId - Cloudinary public ID
 * @param mediaType - 'image' | 'video'
 * @param cloud - Cloudinary cloud name
 * @returns Complete Cloudinary URL
 */
export function cloudinaryUrl(publicId, mediaType, cloud) {
    const base = `https://res.cloudinary.com/${cloud}`;
    return mediaType === 'video'
        ? `${base}/video/upload/${publicId}.mp4`
        : `${base}/image/upload/${publicId}.jpg`;
}
/**
 * Get Cloudinary cloud name from environment
 * @returns Cloudinary cloud name
 */
export function getCloudinaryCloudName() {
    return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
}
/**
 * Construct Cloudinary URL using environment cloud name
 * @param publicId - Cloudinary public ID
 * @param mediaType - 'image' | 'video'
 * @returns Complete Cloudinary URL
 */
export function cloudinaryUrlFromEnv(publicId, mediaType) {
    const cloud = getCloudinaryCloudName();
    if (!cloud) {
        throw new Error('VITE_CLOUDINARY_CLOUD_NAME not configured');
    }
    return cloudinaryUrl(publicId, mediaType, cloud);
}
