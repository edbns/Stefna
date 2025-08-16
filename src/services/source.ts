// src/services/source.ts
import { generationStore } from '../stores/generationStore';

export async function fromAnyToFile(input: File | Blob | string): Promise<File> {
  if (input instanceof File) return input;
  if (input instanceof Blob) return new File([input], 'source.png', { type: input.type || 'image/png' });

  // data: URL
  if (typeof input === 'string' && input.startsWith('data:')) {
    const [meta, b64] = input.split(',');
    const mime = (/data:(.*?);base64/.exec(meta)?.[1]) || 'image/png';
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new File([bytes], 'source.png', { type: mime });
  }

  // blob: URL (what your preview uses) - DON'T fetch these!
  if (typeof input === 'string' && input.startsWith('blob:')) {
    // Instead of fetching the blob URL (which can fail), 
    // try to get the original file from global state
    const fallback = window.__lastSelectedFile as File | undefined;
    if (fallback) {
      console.log('🔄 Using fallback file instead of fetching blob URL');
      return fallback;
    }
    
    // If no fallback, throw a clear error
    throw new Error('Blob URL detected but no original file available. Please select the file again.');
  }

  throw new Error('No valid image source selected.');
}

export async function getSourceFileOrThrow(candidate?: File | Blob | string | null): Promise<File> {
  const st = generationStore.getState();
  
  // Prioritize the actual File object over blob URLs
  const raw = candidate ?? st.selectedFile ?? st.previewBlob ?? st.previewDataUrl ?? st.previewUrl;
  
  // If we have a File, use it directly (no fetch needed)
  if (raw instanceof File) {
    console.log('✅ Using File object directly (no fetch needed)');
    return raw;
  }
  
  // If we have a Blob, convert to File
  if (raw instanceof Blob) {
    console.log('✅ Converting Blob to File (no fetch needed)');
    return new File([raw], 'source.png', { type: raw.type || 'image/png' });
  }
  
  // For strings (data URLs, blob URLs), use fromAnyToFile
  if (typeof raw === 'string') {
    console.log('⚠️ String source detected, attempting conversion...');
    return fromAnyToFile(raw);
  }
  
  throw new Error('No valid image source selected.');
}

// Optional: quick debug helper
export function dbgSource(label: string) {
  const s = generationStore.getState();
  console.log('DBG source', label, {
    hasFile: !!s.selectedFile,
    hasBlob: !!s.previewBlob,
    hasDataUrl: !!s.previewDataUrl,
    hasPreviewUrl: !!s.previewUrl,
  });
}
