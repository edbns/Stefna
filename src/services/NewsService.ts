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
  private baseURL = 'https://newsdata.io/api/1';
  private apiKey = import.meta.env.VITE_NEWSDATA_API_KEY;

  async getTrendingNews(limit: number = 10): Promise<NewsArticle[]> {
    try {
      console.log('Fetching trending news...');
      
      if (!this.apiKey) {
        throw new Error('NewsData API key not found');
      }

      const response = await fetch(
        `${this.baseURL}/news?apikey=${this.apiKey}&country=us&language=en&category=technology,top&size=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`News API failed: ${response.status}`);
      }
      
      const data: NewsResponse = await response.json();
      console.log('News data received:', data.results.length, 'articles');
      return data.results;
    } catch (error) {
      console.error('News API error:', error);
      throw error;
    }
  }

  async getNewsByCategory(category: string, limit: number = 10): Promise<NewsArticle[]> {
    try {
      if (!this.apiKey) {
        throw new Error('NewsData API key not found');
      }

      const response = await fetch(
        `${this.baseURL}/news?apikey=${this.apiKey}&country=us&language=en&category=${category}&size=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`News API failed: ${response.status}`);
      }
      
      const data: NewsResponse = await response.json();
      return data.results;
    } catch (error) {
      console.error('News API error:', error);
      throw error;
    }
  }
}

export default new NewsService(); 