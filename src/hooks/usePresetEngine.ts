import { useState, useEffect, useCallback } from 'react';
import { 
  getActivePresets, 
  getPresetStats, 
  buildPresetPayload, 
  searchPresets, 
  getPresetsByCategory,
  PresetCategory,
  PresetOption,
  ActivePresetResult
} from '../config/presetEngine';

export interface PresetEngineState {
  activePresets: ActivePresetResult[];
  selectedPreset: string | null;
  searchQuery: string;
  selectedCategory: PresetCategory | 'all';
  stats: {
    total: number;
    byCategory: Record<PresetCategory, number>;
    averageStrength: number;
  };
  isLoading: boolean;
}

export interface PresetEngineActions {
  selectPreset: (presetKey: string) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setCategory: (category: PresetCategory | 'all') => void;
  searchPresets: (query: string) => void;
  filterByCategory: (category: PresetCategory | 'all') => void;
  buildPayload: (imageUrl: string, customPrompt?: string) => any;
  refreshPresets: () => void;
}

export function usePresetEngine(): PresetEngineState & PresetEngineActions {
  const [state, setState] = useState<PresetEngineState>({
    activePresets: [],
    selectedPreset: null,
    searchQuery: '',
    selectedCategory: 'all',
    stats: {
      total: 0,
      byCategory: {} as Record<PresetCategory, number>,
      averageStrength: 0
    },
    isLoading: true
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const presets = getActivePresets();
      const stats = getPresetStats();
      
      setState(prev => ({
        ...prev,
        activePresets: presets,
        stats,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load preset data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const selectPreset = useCallback((presetKey: string) => {
    setState(prev => ({ ...prev, selectedPreset: presetKey }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedPreset: null }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setCategory = useCallback((category: PresetCategory | 'all') => {
    setState(prev => ({ ...prev, selectedCategory: category }));
  }, []);

  const searchPresets = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    
    if (query.trim()) {
      try {
        const results = searchPresets(query);
        const mappedResults = results.map(preset => ({
          presetKey: preset.key,
          displayName: preset.displayName,
          category: preset.category,
          thumbnail: preset.thumbnail,
          promptFragment: preset.promptFragment,
          strength: preset.strength,
          model: preset.model,
          features: preset.features,
          description: preset.description
        }));
        
        setState(prev => ({ ...prev, activePresets: mappedResults }));
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      // Reset to active presets
      const presets = getActivePresets();
      setState(prev => ({ ...prev, activePresets: presets }));
    }
  }, []);

  const filterByCategory = useCallback((category: PresetCategory | 'all') => {
    setState(prev => ({ ...prev, selectedCategory: category }));
    
    if (category === 'all') {
      const presets = getActivePresets();
      setState(prev => ({ ...prev, activePresets: presets }));
    } else {
      try {
        const categoryPresets = getPresetsByCategory(category);
        const mappedResults = categoryPresets.map(preset => ({
          presetKey: preset.key,
          displayName: preset.displayName,
          category: preset.category,
          thumbnail: preset.thumbnail,
          promptFragment: preset.promptFragment,
          strength: preset.strength,
          model: preset.model,
          features: preset.features,
          description: preset.description
        }));
        
        setState(prev => ({ ...prev, activePresets: mappedResults }));
      } catch (error) {
        console.error('Category filter failed:', error);
      }
    }
  }, []);

  const buildPayload = useCallback((imageUrl: string, customPrompt?: string) => {
    if (!state.selectedPreset) {
      throw new Error('No preset selected');
    }
    
    try {
      return buildPresetPayload(state.selectedPreset as any, imageUrl, customPrompt);
    } catch (error) {
      console.error('Failed to build payload:', error);
      throw error;
    }
  }, [state.selectedPreset]);

  const refreshPresets = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    ...state,
    selectPreset,
    clearSelection,
    setSearchQuery,
    setCategory,
    searchPresets,
    filterByCategory,
    buildPayload,
    refreshPresets
  };
}

// Hook for preset selection with local storage persistence
export function usePresetSelection() {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(() => {
    try {
      return localStorage.getItem('selectedPreset');
    } catch {
      return null;
    }
  });

  const selectPreset = useCallback((presetKey: string) => {
    setSelectedPreset(presetKey);
    try {
      localStorage.setItem('selectedPreset', presetKey);
    } catch (error) {
      console.warn('Failed to save preset selection:', error);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPreset(null);
    try {
      localStorage.removeItem('selectedPreset');
    } catch (error) {
      console.warn('Failed to clear preset selection:', error);
    }
  }, []);

  return {
    selectedPreset,
    selectPreset,
    clearSelection
  };
}

// Hook for preset favorites
export function usePresetFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('presetFavorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addFavorite = useCallback((presetKey: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(presetKey) ? prev : [...prev, presetKey];
      try {
        localStorage.setItem('presetFavorites', JSON.stringify(newFavorites));
      } catch (error) {
        console.warn('Failed to save favorites:', error);
      }
      return newFavorites;
    });
  }, []);

  const removeFavorite = useCallback((presetKey: string) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(key => key !== presetKey);
      try {
        localStorage.setItem('presetFavorites', JSON.stringify(newFavorites));
      } catch (error) {
        console.warn('Failed to save favorites:', error);
      }
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((presetKey: string) => {
    return favorites.includes(presetKey);
  }, [favorites]);

  const toggleFavorite = useCallback((presetKey: string) => {
    if (isFavorite(presetKey)) {
      removeFavorite(presetKey);
    } else {
      addFavorite(presetKey);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite
  };
}
