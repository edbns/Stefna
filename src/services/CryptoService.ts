export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: any;
  last_updated: string;
  sparkline_in_7d: {
    price: number[];
  };
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_24h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
}

class CryptoService {
  private baseURL = 'https://api.coingecko.com/api/v3';

  async getTrendingCrypto(limit: number = 10): Promise<CryptoCoin[]> {
    try {
      console.log('Fetching trending crypto...');
      const response = await fetch(
        `${this.baseURL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
      );
      
      if (!response.ok) {
        throw new Error(`Crypto API failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Crypto data received:', data.length, 'coins');
      return data;
    } catch (error) {
      console.error('Crypto API error:', error);
      throw error;
    }
  }

  async getCryptoDetails(coinId: string): Promise<CryptoCoin> {
    try {
      const response = await fetch(`${this.baseURL}/coins/${coinId}`);
      
      if (!response.ok) {
        throw new Error(`Crypto details API failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Crypto details API error:', error);
      throw error;
    }
  }
}

export default new CryptoService(); 