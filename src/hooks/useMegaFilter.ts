import { useState, useMemo } from 'react';
import { Content } from '../types';

interface MegaFilterState {
  query: string;
  platforms: string[];
  categories: string[];
  creators: string[];
  verifiedOnly: boolean;
  followerRange: { min: number; max: number };
  hashtags: string[];
  viewsRange: { min: number; max: number };
  likesRange: { min: number; max: number };
  commentsRange: { min: number; max: number };
  sharesRange: { min: number; max: number };
  engagementRate: { min: number; max: number };
  trendingScore: { min: number; max: number };
  sentiment: string[];
  dateRange: string;
  customDateRange: { start: Date | null; end: Date | null };
  locations: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  hasAiSummary: boolean;
  hasLocation: boolean;
}

export const useMegaFilter = (data: Content[]) => {
  const [filters, setFilters] = useState<MegaFilterState>({
    query: '',
    platforms: [],
    categories: [],
    creators: [],
    verifiedOnly: false,
    followerRange: { min: 0, max: 10000000 },
    hashtags: [],
    viewsRange: { min: 0, max: 100000000 },
    likesRange: { min: 0, max: 10000000 },
    commentsRange: { min: 0, max: 1000000 },
    sharesRange: { min: 0, max: 1000000 },
    engagementRate: { min: 0, max: 100 },
    trendingScore: { min: 0, max: 100 },
    sentiment: [],
    dateRange: 'all',
    customDateRange: { start: null, end: null },
    locations: [],
    sortBy: 'trendingScore',
    sortOrder: 'desc',
    hasAiSummary: false,
    hasLocation: false
  });

  const filteredData = useMemo(() => {
    console.log('MegaFilter: Processing', data.length, 'items with filters:', filters);
    let filtered = data.filter(item => {
      // Text search
      if (filters.query) {
        const searchText = filters.query.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(searchText) || false;
        const matchesDescription = item.description?.toLowerCase().includes(searchText) || false;
        const matchesCreator = item.creator?.name?.toLowerCase().includes(searchText) || false;
        const matchesHashtags = item.hashtags?.some(tag => tag.toLowerCase().includes(searchText)) || false;
        const matchesLocation = item.location?.toLowerCase().includes(searchText) || false;
        
        if (!matchesTitle && !matchesDescription && !matchesCreator && !matchesHashtags && !matchesLocation) {
          return false;
        }
      }

      // Platform filter
      if (filters.platforms.length > 0 && !filters.platforms.includes(item.platform)) {
        return false;
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
        return false;
      }

      // Creator filter
      if (filters.creators.length > 0 && !filters.creators.includes(item.creator?.name || '')) {
        return false;
      }

      // Verified only filter
      if (filters.verifiedOnly && !item.creator?.verified) {
        return false;
      }

      // Follower range filter - add safety checks
      const followerCount = item.creator?.followers || 0;
      if (followerCount < (filters.followerRange?.min || 0) || followerCount > (filters.followerRange?.max || Infinity)) {
        return false;
      }

      // Hashtags filter
      if (filters.hashtags.length > 0 && !filters.hashtags.some(tag => item.hashtags?.includes(tag))) {
        return false;
      }

      // Metrics filters - add safety checks
      const views = item.metrics?.views || 0;
      if (views < (filters.viewsRange?.min || 0) || views > (filters.viewsRange?.max || Infinity)) {
        return false;
      }

      // Fix: Add safety checks for all range filters
      const likes = item.metrics?.likes || 0;
      if (likes < (filters.likesRange?.min || 0) || likes > (filters.likesRange?.max || Infinity)) {
        return false;
      }

      const comments = item.metrics?.comments || 0;
      if (comments < (filters.commentsRange?.min || 0) || comments > (filters.commentsRange?.max || Infinity)) {
        return false;
      }

      const shares = item.metrics?.shares || 0;
      if (shares < (filters.sharesRange?.min || 0) || shares > (filters.sharesRange?.max || Infinity)) {
        return false;
      }

      const engagementRate = item.metrics?.engagementRate || 0;
      if (engagementRate < (filters.engagementRate?.min || 0) || engagementRate > (filters.engagementRate?.max || Infinity)) {
        return false;
      }

      const trendingScore = item.trendingScore || 0;
      if (trendingScore < (filters.trendingScore?.min || 0) || trendingScore > (filters.trendingScore?.max || Infinity)) {
        return false;
      }

      // Sentiment filter
      if (filters.sentiment.length > 0 && !filters.sentiment.includes(item.sentiment)) {
        return false;
      }

      // Location filter
      if (filters.locations.length > 0 && (!item.location || !filters.locations.includes(item.location))) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const itemDate = new Date(item.publishedAt);
        const now = new Date();
        let cutoffDate = new Date();

        switch (filters.dateRange) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        if (itemDate < cutoffDate) {
          return false;
        }
      }

      // AI Summary filter
      if (filters.hasAiSummary && !item.aiSummary) {
        return false;
      }

      // Location data filter
      if (filters.hasLocation && !item.location) {
        return false;
      }

      return true;
    });

    console.log('MegaFilter: After filtering,', filtered.length, 'items remain');
    // Sort the filtered data
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'views':
          aValue = a.metrics.views;
          bValue = b.metrics.views;
          break;
        case 'likes':
          aValue = a.metrics.likes;
          bValue = b.metrics.likes;
          break;
        case 'comments':
          aValue = a.metrics.comments;
          bValue = b.metrics.comments;
          break;
        case 'engagementRate':
          aValue = a.metrics.engagementRate;
          bValue = b.metrics.engagementRate;
          break;
        case 'publishedAt':
          aValue = new Date(a.publishedAt).getTime();
          bValue = new Date(b.publishedAt).getTime();
          break;
        case 'trendingScore':
        default:
          aValue = a.trendingScore;
          bValue = b.trendingScore;
          break;
      }

      if (filters.sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [data, filters]);

  return {
    filters,
    setFilters,
    filteredData,
    totalResults: filteredData.length,
    originalTotal: data.length
  };
};