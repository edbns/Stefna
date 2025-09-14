// src/stores/mediaStore.ts
import { create } from 'zustand'
import { UserMedia } from '../services/userMediaService'

interface MediaState {
  media: UserMedia[]
  isLoading: boolean
  loadUserMedia: () => Promise<void>
  deleteMedia: (media: UserMedia) => Promise<void>
  addMedia: (media: UserMedia) => void
  updateMedia: (media: UserMedia) => void
}

export const useMediaStore = create<MediaState>((set, get) => ({
  media: [],
  isLoading: false,
  
  loadUserMedia: async () => {
    set({ isLoading: true });
    
    try {
      const response = await fetch('/.netlify/functions/getUserMedia', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.media) {
        set({ media: data.media });
      } else {
        console.error('Failed to load media:', data.error);
        set({ media: [] });
      }
    } catch (error) {
      console.error('Error loading media:', error);
      set({ media: [] });
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteMedia: async (media) => {
    try {
      const response = await fetch('/.netlify/functions/delete-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ mediaId: media.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        set(state => ({
          media: state.media.filter(m => m.id !== media.id)
        }));
      } else {
        throw new Error(data.error || 'Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  },
  
  addMedia: (media) => {
    set(state => ({
      media: [media, ...state.media]
    }));
  },
  
  updateMedia: (updatedMedia) => {
    set(state => ({
      media: state.media.map(m => 
        m.id === updatedMedia.id ? updatedMedia : m
      )
    }));
  }
}))

// Global access for non-React contexts
export const mediaStore = {
  getState: () => useMediaStore.getState(),
  subscribe: useMediaStore.subscribe,
}
