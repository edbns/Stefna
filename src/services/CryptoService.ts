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

export interface FearGreedIndex {
  value: number;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

export interface TradingPlatform {
  name: string;
  url: string;
  logo: string;
  rating: number;
  features: string[];
}

export interface CryptoAnalytics {
  fearGreedIndex: FearGreedIndex;
  tradingPlatforms: TradingPlatform[];
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  volatilityIndex: number;
  volumeChange24h: number;
  dominanceIndex: number;
}

export interface CryptoDetails extends CryptoCoin {
  analytics?: CryptoAnalytics;
  trading_platforms?: TradingPlatform[];
  community_data?: {
    reddit_subscribers: number;
    twitter_followers: number;
    telegram_channel_user_count: number;
  };
  developer_data?: {
    forks: number;
    stars: number;
    subscribers: number;
    total_issues: number;
    closed_issues: number;
    pull_requests_merged: number;
    pull_requests_contributors: number;
  };
  public_interest_score: number;
  market_data?: {
    total_market_cap: number;
    total_volume: number;
    market_cap_percentage: number;
  };
}

class CryptoService {
  private baseURL = 'https://api.coingecko.com/api/v3';
  private fearGreedURL = 'https://api.alternative.me/fng/';

  async getTrendingCrypto(limit: number = 10): Promise<CryptoCoin[]> {
    try {
      console.log('Fetching trending crypto...');
      const response = await fetch(
        `${this.baseURL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
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

  async getCryptoDetails(coinId: string): Promise<CryptoDetails> {
    try {
      const response = await fetch(`${this.baseURL}/coins/${coinId}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=true&sparkline=true`);
      
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

  async getFearGreedIndex(): Promise<FearGreedIndex> {
    try {
      const response = await fetch(this.fearGreedURL);
      
      if (!response.ok) {
        throw new Error(`Fear/Greed API failed: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        value: parseInt(data.data[0].value),
        value_classification: data.data[0].value_classification,
        timestamp: data.data[0].timestamp,
        time_until_update: data.data[0].time_until_update
      };
    } catch (error) {
      console.error('Fear/Greed API error:', error);
      // Return default values if API fails
      return {
        value: 50,
        value_classification: 'Neutral',
        timestamp: new Date().toISOString(),
        time_until_update: '0'
      };
    }
  }

  getTradingPlatforms(): TradingPlatform[] {
    return [
      {
        name: 'Binance',
        url: 'https://www.binance.com',
        logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png',
        rating: 4.8,
        features: ['Low fees', 'High liquidity', 'Staking', 'DeFi']
      },
      {
        name: 'Coinbase',
        url: 'https://www.coinbase.com',
        logo: 'https://cryptologos.cc/logos/coinbase-coin-logo.png',
        rating: 4.6,
        features: ['User-friendly', 'Insurance', 'Staking', 'Earn rewards']
      },
      {
        name: 'Kraken',
        url: 'https://www.kraken.com',
        logo: 'https://cryptologos.cc/logos/kraken-logo.png',
        rating: 4.7,
        features: ['High security', 'Advanced trading', 'Staking', 'Futures']
      },
      {
        name: 'Kucoin',
        url: 'https://www.kucoin.com',
        logo: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png',
        rating: 4.5,
        features: ['Wide selection', 'Low fees', 'Staking', 'Trading bots']
      },
      {
        name: 'FTX',
        url: 'https://ftx.com',
        logo: 'https://cryptologos.cc/logos/ftx-token-ftt-logo.png',
        rating: 4.4,
        features: ['Futures trading', 'Options', 'High leverage', 'Copy trading']
      }
    ];
  }

  calculateMarketSentiment(fearGreedValue: number): 'bullish' | 'bearish' | 'neutral' {
    if (fearGreedValue >= 60) return 'bullish';
    if (fearGreedValue <= 40) return 'bearish';
    return 'neutral';
  }

  calculateVolatilityIndex(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100; // Convert to percentage
  }

  formatFearGreedColor(value: number): string {
    if (value >= 75) return 'text-green-600';
    if (value >= 50) return 'text-yellow-600';
    if (value >= 25) return 'text-orange-600';
    return 'text-red-600';
  }

  formatFearGreedEmoji(value: number): string {
    if (value >= 75) return '😄';
    if (value >= 50) return '😐';
    if (value >= 25) return '😰';
    return '😱';
  }

  formatVolume(volume: number): string {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  }

  formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(2)}`;
  }

  getPriceChangeColor(change: number): string {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  }

  getPriceChangeIcon(change: number): string {
    return change >= 0 ? '↗️' : '↘️';
  }
}

export default new CryptoService(); 