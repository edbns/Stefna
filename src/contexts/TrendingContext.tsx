import React, { createContext, useContext, useState, useCallback } from 'react';
import { TrendingItem, extractTrends } from '../utils/trendingExtractor';

interface TrendingState {
  hashtags: TrendingItem[];
  categories: TrendingItem[];
  isLoading: boolean;
  lastUpdated: string | null;
}

interface TrendingContextType {
  state: TrendingState;
  addTrends: (items: any[], platform: string) => void;
  clearTrends: () => void;
  setLoading: (loading: boolean) => void;
  getTopHashtags: (limit?: number) => TrendingItem[];
  getTopCategories: (limit?: number) => TrendingItem[];
}

const TrendingContext = createContext<TrendingContextType | undefined>(undefined);

export const useTrending = () => {
  const context = useContext(TrendingContext);
  if (!context) {
    throw new Error('useTrending must be used within a TrendingProvider');
  }
  return context;
};

interface TrendingProviderProps {
  children: React.ReactNode;
}

export const TrendingProvider: React.FC<TrendingProviderProps> = ({ children }) => {
  const [state, setState] = useState<TrendingState>({
    hashtags: [],
    categories: [],
    isLoading: false,
    lastUpdated: null,
  });

  const addTrends = useCallback((items: any[], platform: string) => {
    if (items.length === 0) return;

    const { hashtags, categories } = extractTrends(items, platform);
    const now = new Date().toISOString();

    setState(prev => {
      // Merge hashtags
      const hashtagMap = new Map(prev.hashtags.map(item => [item.name, item]));
      hashtags.forEach(newTag => {
        const existing = hashtagMap.get(newTag.name);
        if (existing) {
          existing.count += newTag.count;
          existing.lastSeen = now;
          if (!existing.platform.includes(platform)) {
            existing.platform += `,${platform}`;
          }
        } else {
          hashtagMap.set(newTag.name, newTag);
        }
      });

      // Merge categories
      const categoryMap = new Map(prev.categories.map(item => [item.name, item]));
      categories.forEach(newCategory => {
        const existing = categoryMap.get(newCategory.name);
        if (existing) {
          existing.count += newCategory.count;
          existing.lastSeen = now;
          if (!existing.platform.includes(platform)) {
            existing.platform += `,${platform}`;
          }
        } else {
          categoryMap.set(newCategory.name, newCategory);
        }
      });

      return {
        ...prev,
        hashtags: Array.from(hashtagMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 50),
        categories: Array.from(categoryMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 30),
        lastUpdated: now,
      };
    });
  }, []);

  const clearTrends = useCallback(() => {
    setState(prev => ({
      ...prev,
      hashtags: [],
      categories: [],
      lastUpdated: null,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const getTopHashtags = useCallback((limit: number = 20) => {
    return state.hashtags.slice(0, limit);
  }, [state.hashtags]);

  const getTopCategories = useCallback((limit: number = 15) => {
    return state.categories.slice(0, limit);
  }, [state.categories]);

  const value: TrendingContextType = {
    state,
    addTrends,
    clearTrends,
    setLoading,
    getTopHashtags,
    getTopCategories,
  };

  return (
    <TrendingContext.Provider value={value}>
      {children}
    </TrendingContext.Provider>
  );
}; 