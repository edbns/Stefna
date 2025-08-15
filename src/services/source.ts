// src/services/source.ts
export async function fromAnyToFile(
  input: File | Blob | string
): Promise<File> {
  if (input instanceof File) return input;
  if (input instanceof Blob) return new File([input], 'source.jpg', { type: input.type || 'image/jpeg' });
  if (typeof input === 'string' && input.startsWith('data:')) {
    const [meta, b64] = input.split(',');
    const match = /data:(.*?);base64/.exec(meta);
    const mime = match?.[1] || 'image/jpeg';
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new File([bytes], 'source.jpg', { type: mime });
  }
  throw new Error('No valid image source selected.');
}

export async function getSourceFileOrThrow(
  candidate?: File | Blob | string | null
): Promise<File> {
  // Try candidate first, then fall back to global state
  const raw = candidate ?? window.__lastSelectedFile;
  if (!raw) throw new Error('Pick an image first.');
  return fromAnyToFile(raw);
}
