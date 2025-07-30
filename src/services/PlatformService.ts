import { Content } from '../types';

class PlatformService {
  private baseURL = '/.netlify/functions';

  async getTrendingContent(platforms: string[] = ['all'], limit = 25): Promise<Content[]> {
    try {
      const allContent: Content[] = [];
      const itemsPerPlatform = Math.max(1, Math.floor(limit / 4)); // Back to original calculation
      console.log('Fetching content for platforms:', platforms, 'Items per platform:', itemsPerPlatform);
      
      if (platforms.includes('all') || platforms.includes('reddit')) {
        try {
          const redditContent = await this.getRedditContent(itemsPerPlatform);
          console.log('Reddit content fetched:', redditContent.length, 'items');
          if (redditContent.length === 0) {
            console.log('Reddit returned empty, no mock data fallback');
          } else {
            allContent.push(...redditContent);
          }
        } catch (error) {
          console.log('Reddit failed, no mock data fallback', error);
        }
      }
      
      if (platforms.includes('all') || platforms.includes('tiktok')) {
        console.log('TikTok API not implemented yet, skipping...');
      }
      
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

      if (platforms.includes('all') || platforms.includes('instagram')) {
        console.log('Instagram API not implemented yet, skipping...');
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

  private async getRedditContent(limit: number): Promise<Content[]> {
    try {
      console.log('Calling Reddit API...');
      const response = await fetch(`${this.baseURL}/trending-reddit?limit=${limit}`);
      console.log('Reddit response status:', response.status);
      if (!response.ok) throw new Error(`Reddit API failed: ${response.status}`);
      const data = await response.json();
      console.log('Reddit data received:', data);
      return data.data || [];
    } catch (error) {
      console.error('Reddit API error:', error);
      throw error; // Let the caller handle the fallback
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

  private async generateAISummaries(content: Content[]): Promise<Content[]> {
    try {
      const response = await fetch(`${this.baseURL}/openrouter-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        console.error('OpenRouter API failed:', response.status);
        return content; // Return content without summaries
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        console.error('OpenRouter API returned invalid data');
        return content;
      }

      // Update content with AI summaries
      const summaries = data.data;
      return content.map(item => {
        const summary = summaries.find((s: any) => s.id === item.id);
        return {
          ...item,
          aiSummary: summary?.aiSummary || item.aiSummary || 'AI summary unavailable'
        };
      });
    } catch (error) {
      console.error('Error generating AI summaries:', error);
      return content; // Return content without summaries
    }
  }


}

export default new PlatformService();