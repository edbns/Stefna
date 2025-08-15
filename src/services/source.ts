// src/services/source.ts
import { generationStore } from '../stores/generationStore';

export async function fromAnyToFile(input: File | Blob | string): Promise<File> {
  if (input instanceof File) return input;
  if (input instanceof Blob) return new File([input], 'source.jpg', { type: input.type || 'image/jpeg' });
  if (typeof input === 'string' && input.startsWith('data:')) {
    const [meta, b64] = input.split(',');
    const mime = (/data:(.*?);base64/.exec(meta)?.[1]) || 'image/jpeg';
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new File([bytes], 'source.jpg', { type: mime });
  }
  throw new Error('No valid image source selected.');
}

export async function getSourceFileOrThrow(candidate?: File | Blob | string | null): Promise<File> {
  const st = generationStore.getState();
  const raw = candidate ?? st.selectedFile ?? st.previewBlob ?? st.previewDataUrl;
  return fromAnyToFile(raw as any);
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
