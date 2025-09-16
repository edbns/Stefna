// Download utilities for media files
import JSZip from 'jszip';

export interface DownloadableMedia {
  id: string;
  url: string;
  filename: string;
  type: 'image' | 'video';
}

/**
 * Downloads a single media file
 */
export const downloadSingleFile = async (media: DownloadableMedia): Promise<void> => {
  try {
    const response = await fetch(media.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = media.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading single file:', error);
    throw error;
  }
};

/**
 * Downloads multiple media files as a ZIP archive
 */
export const downloadMultipleFilesAsZip = async (
  mediaItems: DownloadableMedia[],
  zipFilename: string = 'media-download.zip'
): Promise<void> => {
  try {
    const zip = new JSZip();
    
    // Add each media file to the ZIP
    for (const media of mediaItems) {
      try {
        const response = await fetch(media.url);
        if (!response.ok) {
          console.warn(`Failed to fetch ${media.filename}: ${response.statusText}`);
          continue;
        }
        
        const blob = await response.blob();
        zip.file(media.filename, blob);
      } catch (error) {
        console.warn(`Error adding ${media.filename} to ZIP:`, error);
        continue;
      }
    }
    
    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Download the ZIP file
    const url = window.URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    throw error;
  }
};

/**
 * Generates a filename for media based on its properties
 */
export const generateMediaFilename = (media: DownloadableMedia, index?: number): string => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const extension = media.type === 'image' ? 'jpg' : 'mp4';
  
  if (index !== undefined) {
    return `media-${timestamp}-${String(index + 1).padStart(3, '0')}.${extension}`;
  }
  
  return `media-${timestamp}.${extension}`;
};

/**
 * Downloads all media files as a ZIP archive
 */
export const downloadAllMediaAsZip = async (
  mediaItems: DownloadableMedia[],
  zipFilename: string = 'all-media.zip'
): Promise<void> => {
  return downloadMultipleFilesAsZip(mediaItems, zipFilename);
};

/**
 * Downloads selected media files as a ZIP archive
 */
export const downloadSelectedMediaAsZip = async (
  mediaItems: DownloadableMedia[],
  zipFilename: string = 'selected-media.zip'
): Promise<void> => {
  return downloadMultipleFilesAsZip(mediaItems, zipFilename);
};
