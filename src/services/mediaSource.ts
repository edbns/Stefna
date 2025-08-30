// src/services/mediaSource.ts
// Centralized HTTPS source resolution - prevents CSP blob: errors

import { uploadToCloudinary } from '../lib/cloudinaryUpload'

// Global stash for the last selected file (simple, reliable)
declare global {
  interface Window {
    __lastSelectedFile?: File | Blob
  }
}

export async function getHttpsSource({ file, url }: { file?: File|Blob; url?: string }) {
  // Prefer the file; never fetch blob: (CSP will block).
  if (file) {
    // Convert Blob to File if needed, or skip if it's not a File
    if (file instanceof File) {
      const result = await uploadToCloudinary(file, 'stefna/sources')
      return result.secure_url
    } else {
      // Skip Blob objects for now - they need to be converted to File first
      console.warn('Blob objects are not yet supported for direct upload')
      throw new Error('Blob objects must be converted to File before upload')
    }
  }

  if (!url) throw new Error('No source provided')

  if (url.startsWith('https://')) return url

  if (url.startsWith('blob:')) {
    // DO NOT fetch blob: (CSP). If we only have a blob URL, pull the original
    // File/Blob from state where the uploader put it.
    const fallback = window.__lastSelectedFile as File | undefined
    if (!fallback) throw new Error('Blob URL without original file')
    const result = await uploadToCloudinary(fallback, 'stefna/sources')
    return result.secure_url
  }

  throw new Error('Unsupported source URL')
}

// Store the selected file globally when user picks it
export function storeSelectedFile(file: File | Blob) {
  window.__lastSelectedFile = file
}
