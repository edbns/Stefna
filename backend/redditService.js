const axios = require('axios');

class RedditService {
  constructor() {
    this.baseURL = 'https://www.reddit.com';
    this.userAgent = 'Stefna/1.0';
  }

  async getTrendingPosts(subreddit = 'all', limit = 25, timeframe = 'day') {
    try {
      const response = await axios.get(`${this.baseURL}/r/${subreddit}/top.json`, {
        params: {
          limit,
          t: timeframe // hour, day, week, month, year, all
        },
        headers: {
          'User-Agent': this.userAgent
        }
      });

      return response.data.data.children.map(post => ({
        id: post.data.id,
        title: post.data.title,
        description: post.data.selftext || '',
        thumbnail: post.data.thumbnail !== 'self' ? post.data.thumbnail : null,
        platform: 'reddit',
        creator: {
          name: post.data.author,
          avatar: null,
          verified: false,
          followers: 0
        },
        metrics: {
          views: 0, // Reddit doesn't provide view count
          likes: post.data.ups,
          comments: post.data.num_comments,
          shares: 0,
          engagementRate: this.calculateEngagementRate(post.data)
        },
        trendingScore: post.data.score,
        sentiment: this.analyzeSentiment(post.data.title),
        category: post.data.subreddit,
        hashtags: this.extractHashtags(post.data.title),
        publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
        url: `https://reddit.com${post.data.permalink}`,
        aiSummary: `Reddit post from r/${post.data.subreddit} with ${post.data.score} upvotes`,
        subreddit: post.data.subreddit
      }));
    } catch (error) {
      console.error('Reddit API Error:', error);
      return [];
    }
  }

  calculateEngagementRate(postData) {
    const totalInteractions = postData.ups + postData.num_comments;
    return totalInteractions > 0 ? (totalInteractions / 1000) * 100 : 0;
  }

  analyzeSentiment(text) {
    // Simple sentiment analysis - replace with actual AI service
    const positiveWords = ['amazing', 'great', 'awesome', 'love', 'best'];
    const negativeWords = ['terrible', 'awful', 'hate', 'worst', 'bad'];
    
    const lowerText = text.toLowerCase();
    const hasPositive = positiveWords.some(word => lowerText.includes(word));
    const hasNegative = negativeWords.some(word => lowerText.includes(word));
    
    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'neutral';
  }

  extractHashtags(text) {
    const hashtags = text.match(/#\w+/g) || [];
    return hashtags.slice(0, 5); // Limit to 5 hashtags
  }
}

module.exports = RedditService;