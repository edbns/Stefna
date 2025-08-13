// Media URL utilities for Cloudinary resources
// Handles both image and video URL generation

/**
 * Generate final Cloudinary URL for media assets
 */
export function toFinalUrl(publicId: string, resourceType: "image" | "video"): string {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    console.warn('VITE_CLOUDINARY_CLOUD_NAME not configured');
    return publicId; // fallback to raw public_id
  }

  const base = `https://res.cloudinary.com/${cloudName}`;
  
  if (resourceType === "video") {
    return `${base}/video/upload/${publicId}.mp4`;
  } else {
    return `${base}/image/upload/${publicId}.jpg`;
  }
}

/**
 * Extract public_id from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  try {
    // Match pattern: https://res.cloudinary.com/{cloud}/image|video/upload/{public_id}.ext
    const match = url.match(/\/(?:image|video)\/upload\/([^.?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Determine resource type from URL or file extension
 */
export function getResourceType(url: string): "image" | "video" {
  const videoExtensions = ['.mp4', '.webm', '.avi', '.mov', '.mkv'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const lowerUrl = url.toLowerCase();
  
  // Check if URL contains video indicators
  if (lowerUrl.includes('/video/upload/') || videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return "video";
  }
  
  // Check if URL contains image indicators  
  if (lowerUrl.includes('/image/upload/') || imageExtensions.some(ext => lowerUrl.includes(ext))) {
    return "image";
  }
  
  // Default to image if uncertain
  return "image";
}

/**
 * Generate optimized Cloudinary URL with transformations
 */
export function getOptimizedUrl(
  publicId: string, 
  resourceType: "image" | "video",
  options?: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | string;
  }
): string {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return toFinalUrl(publicId, resourceType);

  const base = `https://res.cloudinary.com/${cloudName}`;
  const { width, height, quality = 'auto', format = 'auto' } = options || {};
  
  // Build transformation string
  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (quality) transforms.push(`q_${quality}`);
  if (format) transforms.push(`f_${format}`);
  
  const transformStr = transforms.length > 0 ? `${transforms.join(',')}/` : '';
  
  if (resourceType === "video") {
    return `${base}/video/upload/${transformStr}${publicId}.mp4`;
  } else {
    return `${base}/image/upload/${transformStr}${publicId}.jpg`;
  }
}

/**
 * Generate thumbnail URL for videos
 */
export function getVideoThumbnail(publicId: string, options?: { width?: number; height?: number }): string {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return toFinalUrl(publicId, "image");

  const { width = 400, height = 300 } = options || {};
  const base = `https://res.cloudinary.com/${cloudName}`;
  
  return `${base}/video/upload/w_${width},h_${height},c_fill,f_jpg,so_0/${publicId}.jpg`;
}

/**
 * Map feed item to final URLs (for compatibility with existing code)
 */
export function mapFeedItemUrls(item: any) {
  const publicId = item.cloudinary_public_id || item.public_id;
  const resourceType = item.media_type || item.resource_type || getResourceType(item.url || '');
  
  if (!publicId) {
    return {
      ...item,
      final: item.url || item.result_url || '',
      thumbnail: item.url || item.result_url || ''
    };
  }
  
  return {
    ...item,
    final: toFinalUrl(publicId, resourceType),
    thumbnail: resourceType === 'video' 
      ? getVideoThumbnail(publicId)
      : getOptimizedUrl(publicId, 'image', { width: 400, height: 300 })
  };
}
