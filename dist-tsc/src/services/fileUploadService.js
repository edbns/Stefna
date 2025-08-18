// File Upload Service - Handles file uploads for I2I and V2V functionality
// Supports uploading to various providers (Netlify Large Media, S3, etc.)
// 
// TODO: Replace with Cloudinary integration for production
// - Better compression and optimization
// - AI-powered transformations
// - Global CDN
// - Video processing support
// - Background removal
// - Smart cropping
class FileUploadService {
    static getInstance() {
        if (!FileUploadService.instance) {
            FileUploadService.instance = new FileUploadService();
        }
        return FileUploadService.instance;
    }
    constructor() {
        // Initialize upload service
    }
    // Upload file to public URL for I2I/V2V processing
    async uploadFile(file, onProgress) {
        try {
            // Check file size first (increased limit for better compression)
            if (file.size > 8 * 1024 * 1024) { // 8MB limit
                throw new Error('File too large. Maximum size is 8MB. Please compress your file or use a smaller one.');
            }
            // For very small files (< 300KB), we can use base64
            if (file.size <= 300 * 1024) {
                return await this.uploadAsBase64(file, onProgress);
            }
            // For larger files, compress and upload
            return await this.uploadWithCompression(file, onProgress);
        }
        catch (error) {
            console.error('Upload failed:', error);
            throw error instanceof Error ? error : new Error('Upload failed');
        }
    }
    // Upload to Netlify Large Media
    async uploadToNetlify(file, onProgress) {
        try {
            onProgress?.({ progress: 0, status: 'uploading' });
            // Create FormData
            const formData = new FormData();
            formData.append('file', file);
            // Upload to Netlify Large Media
            const response = await fetch('/.netlify/functions/upload', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }
            const result = await response.json();
            onProgress?.({ progress: 100, status: 'completed' });
            return {
                url: result.url,
                filename: result.filename || file.name,
                size: file.size,
                type: file.type
            };
        }
        catch (error) {
            onProgress?.({ progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' });
            throw error instanceof Error ? error : new Error('Upload failed');
        }
    }
    // Upload as base64 (for small files)
    async uploadAsBase64(file, onProgress) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const base64 = reader.result;
                    const url = base64; // Use base64 directly as URL
                    onProgress?.({ progress: 100, status: 'completed' });
                    resolve({
                        url,
                        filename: file.name,
                        size: file.size,
                        type: file.type
                    });
                }
                catch (error) {
                    onProgress?.({ progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' });
                    reject(error);
                }
            };
            reader.onerror = () => {
                const error = new Error('Failed to read file');
                onProgress?.({ progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' });
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }
    // Upload with compression for larger files
    async uploadWithCompression(file, onProgress) {
        try {
            onProgress?.({ progress: 0, status: 'uploading' });
            // Create a compressed version of the file
            const compressedFile = await this.compressFile(file);
            onProgress?.({ progress: 50, status: 'uploading' });
            // Check if compression was successful and file is now small enough for base64
            if (compressedFile.size <= 300 * 1024) {
                onProgress?.({ progress: 75, status: 'uploading' });
                return await this.uploadAsBase64(compressedFile, onProgress);
            }
            // If still too large, try more aggressive compression
            if (compressedFile.size > 500 * 1024) {
                const aggressiveCompressedFile = await this.aggressiveCompressFile(file);
                if (aggressiveCompressedFile.size <= 500 * 1024) {
                    onProgress?.({ progress: 75, status: 'uploading' });
                    return await this.uploadAsBase64(aggressiveCompressedFile, onProgress);
                }
            }
            // Final fallback - upload compressed file
            const formData = new FormData();
            formData.append('file', compressedFile);
            const response = await fetch('/.netlify/functions/upload', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} - ${response.statusText}`);
            }
            const result = await response.json();
            onProgress?.({ progress: 100, status: 'completed' });
            return {
                url: result.url,
                filename: result.filename || file.name,
                size: compressedFile.size,
                type: compressedFile.type
            };
        }
        catch (error) {
            onProgress?.({ progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' });
            throw error instanceof Error ? error : new Error('Upload failed');
        }
    }
    // Aggressive compression for larger files
    async aggressiveCompressFile(file) {
        return new Promise((resolve, reject) => {
            if (file.type.startsWith('image/')) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                    // More aggressive compression - max 800px
                    const maxSize = 800;
                    let { width, height } = img;
                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    }
                    else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    // Draw and compress with lower quality
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                            resolve(compressedFile);
                        }
                        else {
                            reject(new Error('Failed to compress image aggressively'));
                        }
                    }, 'image/jpeg', 0.6); // 60% quality for aggressive compression
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = URL.createObjectURL(file);
            }
            else {
                // For non-images, return as is
                resolve(file);
            }
        });
    }
    // Compress file to reduce size
    async compressFile(file) {
        return new Promise((resolve, reject) => {
            if (file.type.startsWith('image/')) {
                // Compress image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                    // Calculate new dimensions (max 1024px)
                    const maxSize = 1024;
                    let { width, height } = img;
                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    }
                    else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    // Draw and compress
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                            resolve(compressedFile);
                        }
                        else {
                            reject(new Error('Failed to compress image'));
                        }
                    }, 'image/jpeg', 0.8); // 80% quality
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = URL.createObjectURL(file);
            }
            else {
                // For non-images, return as is (but this should be handled differently in production)
                resolve(file);
            }
        });
    }
    // Check if we're in a Netlify environment
    isNetlifyEnvironment() {
        return typeof window !== 'undefined' && window.location.hostname.includes('netlify');
    }
    // Validate file type for I2I/V2V
    validateFileForI2I(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        return allowedTypes.includes(file.type);
    }
    validateFileForV2V(file) {
        const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov'];
        return allowedTypes.includes(file.type);
    }
    // Get file size in human readable format
    getFileSizeString(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    // Create a preview URL for the file
    createPreviewUrl(file) {
        return URL.createObjectURL(file);
    }
    // Clean up preview URL
    revokePreviewUrl(url) {
        if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    }
}
export default FileUploadService.getInstance();
