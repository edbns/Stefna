// src/stores/generationStore.ts
import { create } from 'zustand'

interface GenerationState {
  selectedFile: File | null
  selectedFileName: string | null
  previewUrl: string | null
  previewBlob: Blob | null
  previewDataUrl: string | null
  setSelectedFile: (file: File | null) => void
  setSelectedFileName: (fileName: string | null) => void
  setPreviewUrl: (url: string | null) => void
  setPreviewBlob: (blob: Blob | null) => void
  setPreviewDataUrl: (dataUrl: string | null) => void
  clearAll: () => void
}

export const useGenerationStore = create<GenerationState>((set) => ({
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
}))

// Global access for non-React contexts
export const generationStore = {
  getState: () => useGenerationStore.getState(),
  subscribe: useGenerationStore.subscribe,
}
