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
  private baseURL = 'https://newsdata.io/api/1/news';
  private apiKey = import.meta.env.VITE_NEWSDATA_API_KEY;

  async getTrendingNews(limit: number = 10): Promise<NewsArticle[]> {
    try {
      console.log('Fetching trending news...');
      
      if (!this.apiKey) {
        throw new Error('NewsData API key not found - please set VITE_NEWSDATA_API_KEY');
      }

      // Use the correct API format with proper parameters
      const params = new URLSearchParams({
        apikey: this.apiKey,
        country: 'us',
        language: 'en',
        category: 'top',
        size: limit.toString()
      });

      const url = `${this.baseURL}?${params.toString()}`;
      console.log('News API URL:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`News API failed: ${response.status} - ${response.statusText}`);
      }
      
      const data: NewsResponse = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(`News API returned error status: ${data.status}`);
      }
      
      console.log('News data received:', data.results?.length || 0, 'articles');
      return data.results || [];
    } catch (error) {
      console.error('News API error:', error);
      throw error;
    }
  }

  async getNewsByCategory(category: string, limit: number = 10): Promise<NewsArticle[]> {
    try {
      if (!this.apiKey) {
        throw new Error('NewsData API key not found - please set VITE_NEWSDATA_API_KEY');
      }

      const params = new URLSearchParams({
        apikey: this.apiKey,
        country: 'us',
        language: 'en',
        category: category,
        size: limit.toString()
      });

      const url = `${this.baseURL}?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`News API failed: ${response.status} - ${response.statusText}`);
      }
      
      const data: NewsResponse = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(`News API returned error status: ${data.status}`);
      }
      
      return data.results || [];
    } catch (error) {
      console.error('News API error:', error);
      throw error;
    }
  }
}

export default new NewsService(); 