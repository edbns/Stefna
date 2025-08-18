// models.ts - I2V-only models (Kling v1.6 supports image-to-video only)
export const MODELS = {
    I2V_STD: 'kling-video/v1.6/standard/image-to-video',
    I2V_PRO: 'kling-video/v1.6/pro/image-to-video',
};
export function detectIsVideo(url) {
    return !!url && /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}
export function isVideoAsset(asset) {
    return asset?.resource_type === 'video'
        || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(asset?.secure_url || asset?.url || '');
}
// Convert Cloudinary video URL to a frame image URL
export function toCloudinaryFrame(url, second = 0, width = 1024) {
    if (!url?.includes('res.cloudinary.com'))
        return url;
    // Turn a Cloudinary video into a JPG frame URL
    return url
        .replace('/video/upload/', `/video/upload/so_${second},w_${width},f_jpg,q_auto/`)
        .replace(/\.(mp4|mov|m4v|webm)(\?|$)/i, '.jpg$2');
}
