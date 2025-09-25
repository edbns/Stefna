// Download utilities for media files
import JSZip from 'jszip';

export interface DownloadableMedia {
  id: string;
  url: string;
  filename: string;
  type: 'image' | 'video';
  presetKey?: string;
  presetType?: string;
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
 * Generates a descriptive filename for media based on its properties
 */
export const generateMediaFilename = (media: DownloadableMedia, index?: number): string => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const extension = media.type === 'image' ? 'jpg' : 'mp4';
  
  // Generate descriptive filename
  let baseName = 'Stefna';
  
  if (media.presetType && media.presetKey) {
    // Convert presetType to readable format
    const typeMap: Record<string, string> = {
      'parallel_self': 'parallelself',
      'cyber_siren': 'cybersiren', 
      'unreal_reflection': 'unrealreflection',
      'ghibli_reaction': 'ghiblireaction',
      'edit': 'edit',
      'presets': 'preset',
      'custom': 'custom',
      'story_time': 'storytime'
    };
    
    const readableType = typeMap[media.presetType] || media.presetType;
    const readablePreset = media.presetKey.replace(/_/g, ''); // Remove underscores
    
    baseName = `Stefna-${readableType}-${readablePreset}`;
  } else if (media.presetType) {
    // If we have presetType but no presetKey, use just the type
    const typeMap: Record<string, string> = {
      'parallel_self': 'parallelself',
      'cyber_siren': 'cybersiren', 
      'unreal_reflection': 'unrealreflection',
      'ghibli_reaction': 'ghiblireaction',
      'edit': 'edit',
      'presets': 'preset',
      'custom': 'custom',
      'story_time': 'storytime'
    };
    
    const readableType = typeMap[media.presetType] || media.presetType;
    baseName = `Stefna-${readableType}`;
  }
  
  if (index !== undefined) {
    return `${baseName}-${timestamp}-${String(index + 1).padStart(3, '0')}.${extension}`;
  }
  
  return `${baseName}-${timestamp}.${extension}`;
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
