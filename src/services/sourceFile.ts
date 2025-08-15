// src/services/sourceFile.ts
export function assertFile(input: File | string | Blob | null | undefined): File {
  if (input instanceof File) return input;
  throw new Error('Select an image file (not a screenshot/preview).');
}

export function getSourceFile(file?: File): File | null {
  if (file instanceof File) return file;
  
  // Fallback to global state if available
  const globalFile = window.__lastSelectedFile as File | undefined;
  if (globalFile instanceof File) return globalFile;
  
  return null;
}
