// src/services/sourceFile.ts
export function assertFile(input) {
    if (input instanceof File)
        return input;
    throw new Error('Select an image file (not a screenshot/preview).');
}
export function getSourceFile(file) {
    if (file instanceof File)
        return file;
    // Fallback to global state if available
    const globalFile = window.__lastSelectedFile;
    if (globalFile instanceof File)
        return globalFile;
    return null;
}
