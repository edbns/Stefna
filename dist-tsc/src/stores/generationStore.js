// src/stores/generationStore.ts
import { create } from 'zustand';
export const useGenerationStore = create((set) => ({
    selectedFile: null,
    selectedFileName: null,
    previewUrl: null,
    previewBlob: null,
    previewDataUrl: null,
    setSelectedFile: (file) => set({ selectedFile: file }),
    setSelectedFileName: (fileName) => set({ selectedFileName: fileName }),
    setPreviewUrl: (url) => set({ previewUrl: url }),
    setPreviewBlob: (blob) => set({ previewBlob: blob }),
    setPreviewDataUrl: (dataUrl) => set({ previewDataUrl: dataUrl }),
    clearAll: () => set({
        selectedFile: null,
        selectedFileName: null,
        previewUrl: null,
        previewBlob: null,
        previewDataUrl: null
    })
}));
// Global access for non-React contexts
export const generationStore = {
    getState: () => useGenerationStore.getState(),
    subscribe: useGenerationStore.subscribe,
};
