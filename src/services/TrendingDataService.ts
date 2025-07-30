import PlatformService from './PlatformService';
import NewsService from './NewsService';
import CryptoService from './CryptoService';

export interface TrendingHashtag {
  name: string;
  count: number;
  platform: string;
  url?: string;
}

export interface TrendingCategory {
  name: string;
  count: number;
  platform: string;
  color: string;
}

class TrendingDataService {
  async getTrendingHashtags(): Promise<TrendingHashtag[]> {
    try {
      const hashtags: TrendingHashtag[] = [];
      
      // Extract hashtags from YouTube content
      try {
        const youtubeContent = await PlatformService.getTrendingContent(['youtube'], 50);
        const youtubeHashtags = this.extractHashtagsFromContent(youtubeContent, 'youtube');
        hashtags.push(...youtubeHashtags);
      } catch (error) {
        console.log('Failed to get YouTube hashtags:', error);
      }

      // Extract hashtags from News content
      try {
        const newsContent = await NewsService.getTrendingNews(50);
        const newsHashtags = this.extractHashtagsFromNews(newsContent);
        hashtags.push(...newsHashtags);
      } catch (error) {
        console.log('Failed to get News hashtags:', error);
      }

      // Group and count hashtags
      const hashtagCounts = new Map<string, { count: number; platforms: string[] }>();
      
      hashtags.forEach(hashtag => {
        const key = hashtag.name.toLowerCase();
        if (hashtagCounts.has(key)) {
          const existing = hashtagCounts.get(key)!;
          existing.count += hashtag.count;
          if (!existing.platforms.includes(hashtag.platform)) {
            existing.platforms.push(hashtag.platform);
          }
        } else {
          hashtagCounts.set(key, {
            count: hashtag.count,
            platforms: [hashtag.platform]
          });
        }
      });

      // Convert back to array and sort by count
      const trendingHashtags: TrendingHashtag[] = Array.from(hashtagCounts.entries())
        .map(([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count: data.count,
          platform: data.platforms.join(', '),
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return trendingHashtags;
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      return [];
    }
  }

  async getTrendingCategories(): Promise<TrendingCategory[]> {
    try {
      const categories: TrendingCategory[] = [];
      
      // Get categories from YouTube content
      try {
        const youtubeContent = await PlatformService.getTrendingContent(['youtube'], 50);
        const youtubeCategories = this.extractCategoriesFromContent(youtubeContent, 'youtube');
        categories.push(...youtubeCategories);
      } catch (error) {
        console.log('Failed to get YouTube categories:', error);
      }

      // Get categories from News content
      try {
        const newsContent = await NewsService.getTrendingNews(50);
        const newsCategories = this.extractCategoriesFromNews(newsContent);
        categories.push(...newsCategories);
      } catch (error) {
        console.log('Failed to get News categories:', error);
      }

      // Group and count categories
      const categoryCounts = new Map<string, { count: number; platforms: string[] }>();
      
      categories.forEach(category => {
        const key = category.name.toLowerCase();
        if (categoryCounts.has(key)) {
          const existing = categoryCounts.get(key)!;
          existing.count += category.count;
          if (!existing.platforms.includes(category.platform)) {
            existing.platforms.push(category.platform);
          }
        } else {
          categoryCounts.set(key, {
            count: category.count,
            platforms: [category.platform]
          });
        }
      });

      // Convert back to array and sort by count
      const trendingCategories: TrendingCategory[] = Array.from(categoryCounts.entries())
        .map(([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count: data.count,
          platform: data.platforms.join(', '),
          color: this.getCategoryColor(name)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      return trendingCategories;
    } catch (error) {
      console.error('Error fetching trending categories:', error);
      return [];
    }
  }

  private extractHashtagsFromContent(content: any[], platform: string): TrendingHashtag[] {
    const hashtags: TrendingHashtag[] = [];
    
    content.forEach(item => {
      if (item.hashtags && Array.isArray(item.hashtags)) {
        item.hashtags.forEach((hashtag: string) => {
          hashtags.push({
            name: hashtag,
            count: 1,
            platform
          });
        });
      }
      
      // Extract hashtags from title and description
      const text = `${item.title} ${item.description}`;
      const hashtagMatches = text.match(/#\w+/g);
      if (hashtagMatches) {
        hashtagMatches.forEach(hashtag => {
          hashtags.push({
            name: hashtag,
            count: 1,
            platform
          });
        });
      }
    });

    return hashtags;
  }

  private extractHashtagsFromNews(newsContent: any[]): TrendingHashtag[] {
    const hashtags: TrendingHashtag[] = [];
    
    newsContent.forEach(article => {
      const text = `${article.title} ${article.description}`;
      const hashtagMatches = text.match(/#\w+/g);
      if (hashtagMatches) {
        hashtagMatches.forEach(hashtag => {
          hashtags.push({
            name: hashtag,
            count: 1,
            platform: 'news'
          });
        });
      }
    });

    return hashtags;
  }

  private extractCategoriesFromContent(content: any[], platform: string): TrendingCategory[] {
    const categories: TrendingCategory[] = [];
    
    content.forEach(item => {
      if (item.category) {
        categories.push({
          name: item.category,
          count: 1,
          platform,
          color: this.getCategoryColor(item.category)
        });
      }
    });

    return categories;
  }

  private extractCategoriesFromNews(newsContent: any[]): TrendingCategory[] {
    const categories: TrendingCategory[] = [];
    
    newsContent.forEach(article => {
      if (article.category && Array.isArray(article.category)) {
        article.category.forEach((cat: string) => {
          categories.push({
            name: cat,
            count: 1,
            platform: 'news',
            color: this.getCategoryColor(cat)
          });
        });
      }
    });

    return categories;
  }

  private getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      technology: 'bg-blue-100 text-blue-600',
      entertainment: 'bg-purple-100 text-purple-600',
      sports: 'bg-orange-100 text-orange-600',
      news: 'bg-red-100 text-red-600',
      music: 'bg-pink-100 text-pink-600',
      gaming: 'bg-green-100 text-green-600',
      business: 'bg-indigo-100 text-indigo-600',
      education: 'bg-yellow-100 text-yellow-600',
      comedy: 'bg-teal-100 text-teal-600',
      lifestyle: 'bg-rose-100 text-rose-600'
    };
    
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-600';
  }
}

export default new TrendingDataService(); 