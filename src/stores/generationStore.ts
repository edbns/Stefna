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
  
  // Mobile app generation functionality
  isGenerating: boolean
  presets: any[]
  loadPresets: () => Promise<void>
  startGeneration: (params: {
    imageUri: string
    mode: string
    presetId?: string
    customPrompt?: string
  }) => Promise<{ success: boolean; jobId?: string; error?: string }>
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
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
  }),
  
  // Mobile app generation functionality
  isGenerating: false,
  presets: [],
  
  loadPresets: async () => {
    try {
      const response = await fetch('/.netlify/functions/get-presets');
      const data = await response.json();
      
      if (data.success && data.presets) {
        set({ presets: data.presets });
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  },
  
  startGeneration: async (params) => {
    set({ isGenerating: true });
    
    try {
      // Convert image URI to file if needed
      let imageFile: File;
      
      if (params.imageUri.startsWith('blob:')) {
        // Convert blob URL to file
        const response = await fetch(params.imageUri);
        const blob = await response.blob();
        imageFile = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      } else {
        // Assume it's a data URL
        const response = await fetch(params.imageUri);
        const blob = await response.blob();
        imageFile = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('mode', params.mode);
      
      if (params.presetId) {
        formData.append('presetId', params.presetId);
      }
      
      if (params.customPrompt) {
        formData.append('prompt', params.customPrompt);
      }
      
      // Call generation API
      const response = await fetch('/.netlify/functions/unified-generate-background', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        return { success: true, jobId: result.jobId };
      } else {
        return { success: false, error: result.error || 'Generation failed' };
      }
    } catch (error) {
      console.error('Generation error:', error);
      return { success: false, error: 'Network error' };
    } finally {
      set({ isGenerating: false });
    }
  }
}))

// Global access for non-React contexts
export const generationStore = {
  getState: () => useGenerationStore.getState(),
  subscribe: useGenerationStore.subscribe,
}
