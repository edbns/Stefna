const axios = require('axios');
const cheerio = require('cheerio'); // For web scraping

class TikTokService {
  constructor() {
    this.baseURL = 'https://www.tiktok.com';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }

  async getTrendingVideos(limit = 25) {
    try {
      // Using TikTok's discover page for trending content
      const response = await axios.get(`${this.baseURL}/discover`, {
        headers: {
          'User-Agent': this.userAgent
        }
      });

      // Parse HTML to extract video data
      const $ = cheerio.load(response.data);
      const videos = [];

      // Extract video data from script tags (TikTok embeds data in JSON)
      $('script').each((i, elem) => {
        const content = $(elem).html();
        if (content && content.includes('window.__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
          try {
            const jsonStr = content.match(/window\.__UNIVERSAL_DATA_FOR_REHYDRATION__ = (.+?);/)[1];
            const data = JSON.parse(jsonStr);
            // Process TikTok data structure
            this.processTikTokData(data, videos, limit);
          } catch (e) {
            console.log('Error parsing TikTok data:', e.message);
          }
        }
      });

      return videos.slice(0, limit);
    } catch (error) {
      console.error('TikTok scraping error:', error);
      return this.getMockTikTokData(limit); // Fallback to mock data
    }
  }

  processTikTokData(data, videos, limit) {
    // Process TikTok's complex data structure
    // This is a simplified version - actual implementation would be more complex
    if (data.default && data.default.webapp && data.default.webapp.video_detail) {
      const videoData = data.default.webapp.video_detail;
      
      Object.values(videoData).forEach(video => {
        if (videos.length >= limit) return;
        
        videos.push({
          id: video.id || Math.random().toString(36),
          title: video.desc || 'TikTok Video',
          description: video.desc || '',
          thumbnail: video.video?.cover || video.video?.dynamicCover,
          platform: 'tiktok',
          creator: {
            name: video.author?.uniqueId || 'Unknown',
            avatar: video.author?.avatarThumb,
            verified: video.author?.verified || false,
            followers: video.author?.followerCount || 0
          },
          metrics: {
            views: video.stats?.playCount || 0,
            likes: video.stats?.diggCount || 0,
            comments: video.stats?.commentCount || 0,
            shares: video.stats?.shareCount || 0,
            engagementRate: this.calculateEngagementRate(video.stats)
          },
          trendingScore: video.stats?.diggCount || 0,
          sentiment: this.analyzeSentiment(video.desc),
          category: 'Entertainment',
          hashtags: this.extractHashtags(video.desc),
          publishedAt: new Date(video.createTime * 1000).toISOString(),
          url: `https://tiktok.com/@${video.author?.uniqueId}/video/${video.id}`,
          aiSummary: `TikTok video with ${video.stats?.playCount || 0} views`
        });
      });
    }
  }

  // Remove or modify getMockTikTokData method:
  getMockTikTokData(limit) {
    // Fallback mock data for testing
    return Array.from({ length: limit }, (_, i) => ({
      id: `tiktok_${i}`,
      title: `Trending TikTok Video #${i + 1}`,
      description: `This is a trending TikTok video that's going viral`,
      thumbnail: `https://picsum.photos/400/600?random=tiktok${i}`,
      platform: 'tiktok',
      creator: {
        name: `@tiktoker${i}`,
        avatar: `https://picsum.photos/100/100?random=user${i}`,
        verified: Math.random() > 0.7,
        followers: Math.floor(Math.random() * 1000000) + 10000
      },
      metrics: {
        views: Math.floor(Math.random() * 10000000) + 100000,
        likes: Math.floor(Math.random() * 500000) + 5000,
        comments: Math.floor(Math.random() * 50000) + 500,
        shares: Math.floor(Math.random() * 25000) + 250,
        engagementRate: Math.random() * 15 + 5
      },
      trendingScore: Math.floor(Math.random() * 100) + 1,
      sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
      category: 'Entertainment',
      hashtags: ['#fyp', '#viral', '#trending', '#tiktok'],
      publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      url: `https://tiktok.com/video/${i}`,
      aiSummary: `Trending TikTok content with high engagement`
    }));
  }

  calculateEngagementRate(stats) {
    if (!stats) return 0;
    const totalEngagement = (stats.diggCount || 0) + (stats.commentCount || 0) + (stats.shareCount || 0);
    const views = stats.playCount || 1;
    return (totalEngagement / views) * 100;
  }

  analyzeSentiment(text) {
    if (!text) return 'neutral';
    const positiveWords = ['amazing', 'love', 'awesome', 'great', 'best', '😍', '❤️', '🔥'];
    const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'bad', '😢', '😡'];
    
    const lowerText = text.toLowerCase();
    const hasPositive = positiveWords.some(word => lowerText.includes(word));
    const hasNegative = negativeWords.some(word => lowerText.includes(word));
    
    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'neutral';
  }

  extractHashtags(text) {
    if (!text) return [];
    const hashtags = text.match(/#\w+/g) || [];
    return hashtags.slice(0, 5);
  }
}

module.exports = TikTokService;