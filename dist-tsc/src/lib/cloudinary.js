export function cloudinaryUrl(publicId, mediaType, cloudName) {
    const base = `https://res.cloudinary.com/${cloudName}`;
    return mediaType === 'video'
        ? `${base}/video/upload/${publicId}.mp4`
        : `${base}/image/upload/${publicId}.jpg`;
}
