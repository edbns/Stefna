export function cloudinaryUrl(publicId: string, mediaType: 'image' | 'video', cloudName: string) {
  const base = `https://res.cloudinary.com/${cloudName}`;
  return mediaType === 'video'
    ? `${base}/video/upload/${publicId}.mp4`
    : `${base}/image/upload/${publicId}.jpg`;
}
