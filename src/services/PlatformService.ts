import { Content } from '../types';

class PlatformService {
  private baseURL = '/.netlify/functions';

  async getTrendingContent(platforms: string[] = ['all'], limit = 25): Promise<Content[]> {
    try {
      const allContent: Content[] = [];
      const itemsPerPlatform = limit; // Use full limit for YouTube since it's the only platform
      console.log('Fetching content for platforms:', platforms, 'Items per platform:', itemsPerPlatform);
      
      if (platforms.includes('all') || platforms.includes('youtube')) {
        try {
          console.log('Attempting to fetch YouTube content...');
          const youtubeContent = await this.getYouTubeContent(itemsPerPlatform);
          console.log('YouTube content fetched:', youtubeContent.length, 'items');
          if (youtubeContent.length === 0) {
            console.log('YouTube returned empty, no mock data fallback');
          } else {
            allContent.push(...youtubeContent);
          }
        } catch (error) {
          console.log('YouTube failed, no mock data fallback', error);
        }
      }

      console.log('Total content before sorting:', allContent.length, 'items');
      console.log('Content by platform:', allContent.reduce((acc, item) => {
        acc[item.platform] = (acc[item.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));

      // Sort by trending score and return limited results
      const sortedContent = allContent
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);
      
      console.log('Final content returned:', sortedContent.length, 'items');
      
      // Temporarily disable AI summaries due to OpenRouter billing issues
      console.log('AI summaries disabled - OpenRouter billing issue');
      return sortedContent;
    } catch (error) {
      console.error('Error fetching trending content:', error);
      return [];
    }
  }





  private async getYouTubeContent(limit: number): Promise<Content[]> {
    try {
      console.log('Calling YouTube API...');
      const response = await fetch(`${this.baseURL}/trending-youtube?limit=${limit}`);
      console.log('YouTube response status:', response.status);
      if (!response.ok) throw new Error(`YouTube API failed: ${response.status}`);
      const data = await response.json();
      console.log('YouTube data received:', data);
      return data.data || [];
    } catch (error) {
      console.error('YouTube API error:', error);
      throw error; // Let the caller handle the fallback
    }
  }




}

export default new PlatformService();