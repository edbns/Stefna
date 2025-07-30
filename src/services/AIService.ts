import { runAIChat, generateYouTubeSummary, getProviderStatus } from './aiProviderPool';

class AIService {
  private static instance: AIService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async chat(message: string, conversationHistory: any[] = []): Promise<string> {
    try {
      // Check provider status
      const status = getProviderStatus();
      console.log(`🤖 AI Provider Status: ${status.available}/${status.total} available`);
      console.log(`📋 Available providers: ${status.providers.join(', ')}`);

      if (status.available === 0) {
        throw new Error('No AI providers available. Please configure API keys.');
      }

      // Create conversation context
      const messages = [
        {
          role: 'system',
          content: 'You are Stefna, a helpful AI assistant for social media intelligence. Provide concise, informative responses.'
        },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      // Use the new provider pool
      const response = await runAIChat(message, 'You are Stefna, a helpful AI assistant for social media intelligence. Provide concise, informative responses.');
      
      return response;
    } catch (error) {
      console.error('AI Chat error:', error);
      
      // Fallback responses based on keywords
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return 'Hello! I\'m Stefna, your social media intelligence assistant. How can I help you today?';
      }
      
      if (lowerMessage.includes('help')) {
        return 'I can help you analyze social media trends, summarize content, and provide insights. What would you like to know?';
      }
      
      if (lowerMessage.includes('trend') || lowerMessage.includes('popular')) {
        return 'I can help you discover trending content across various platforms. Check out the different sections in the sidebar!';
      }
      
      return 'I\'m having trouble connecting to my AI services right now. Please check your API configuration and try again.';
    }
  }

  async summarizeYouTubeVideo(videoUrl: string): Promise<any> {
    try {
      // Extract video ID from URL
      const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Get video data from YouTube API
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = data.items[0];
      const videoData = {
        title: video.snippet.title,
        description: video.snippet.description,
        duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount
      };

      // Use the new provider pool for summarization
      const summary = await generateYouTubeSummary(videoData);
      
      return {
        ...summary,
        videoData
      };
    } catch (error) {
      console.error('YouTube summary error:', error);
      throw error;
    }
  }

  getProviderStatus() {
    return getProviderStatus();
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default AIService; 