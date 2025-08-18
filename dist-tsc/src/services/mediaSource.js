// src/services/mediaSource.ts
// Centralized HTTPS source resolution - prevents CSP blob: errors
import { uploadToCloudinary } from '../lib/cloudinaryUpload';
export async function getHttpsSource({ file, url }) {
    // Prefer the file; never fetch blob: (CSP will block).
    if (file) {
        const result = await uploadToCloudinary(file, 'stefna/sources');
        return result.secure_url;
    }
    if (!url)
        throw new Error('No source provided');
    if (url.startsWith('https://'))
        return url;
    if (url.startsWith('blob:')) {
        // DO NOT fetch blob: (CSP). If we only have a blob URL, pull the original
        // File/Blob from state where the uploader put it.
        const fallback = window.__lastSelectedFile;
        if (!fallback)
            throw new Error('Blob URL without original file');
        const result = await uploadToCloudinary(fallback, 'stefna/sources');
        return result.secure_url;
    }
    throw new Error('Unsupported source URL');
}
// Store the selected file globally when user picks it
export function storeSelectedFile(file) {
    window.__lastSelectedFile = file;
}
