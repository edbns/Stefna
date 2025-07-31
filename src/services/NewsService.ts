export interface NewsArticle {
  link: string;
  title: string;
  description: string;
  content: string;
  pubDate: string;
  image_url: string;
  source_id: string;
  category: string[];
  country: string[];
  language: string;
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  results: NewsArticle[];
  nextPage: string;
}

class NewsService {
  async getTrendingNews(limit: number = 10): Promise<NewsArticle[]> {
    try {
      console.log('Fetching trending news via Netlify function...');
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        category: 'top'
      });

      const response = await fetch(`/.netlify/functions/news-service?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`News service failed: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'News service returned error');
      }
      
      console.log('News data received:', result.data?.length || 0, 'articles');
      return result.data || [];
    } catch (error) {
      console.error('News service error:', error);
      throw error;
    }
  }

  async getNewsByCategory(category: string, limit: number = 10): Promise<NewsArticle[]> {
    try {
      console.log(`Fetching news for category: ${category}`);
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        category: category
      });

      const response = await fetch(`/.netlify/functions/news-service?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`News service failed: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'News service returned error');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('News service error:', error);
      throw error;
    }
  }
}

export default new NewsService(); 