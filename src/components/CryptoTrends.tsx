import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, ExternalLink, Flame, BarChart3, ShoppingCart, Activity, Users, Star, Zap } from 'lucide-react';
import CryptoService, { CryptoCoin, FearGreedIndex, TradingPlatform } from '../services/CryptoService';
import LoadingSpinner from './LoadingSpinner';
import InteractionButtons from './InteractionButtons';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CryptoTrendsProps {
  onAuthOpen?: () => void;
}

const CRYPTO_PER_PAGE = 12;

const CryptoTrends: React.FC<CryptoTrendsProps> = ({ onAuthOpen }) => {
  const [cryptoData, setCryptoData] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fearGreedIndex, setFearGreedIndex] = useState<FearGreedIndex | null>(null);
  const [tradingPlatforms, setTradingPlatforms] = useState<TradingPlatform[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [volatilityIndex, setVolatilityIndex] = useState<number>(0);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  const fetchCryptoData = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await CryptoService.getTrendingCrypto(CRYPTO_PER_PAGE);
      setCryptoData((prev) => (pageNum === 1 ? data : [...prev, ...data]));
      setHasMore(data.length === CRYPTO_PER_PAGE);
    } catch (error) {
      console.error('Failed to fetch crypto data:', error);
      setError('Failed to load crypto trends');
      toast.error('Failed to load crypto trends');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMarketData = useCallback(async () => {
    try {
      // Fetch Fear & Greed Index
      const fearGreed = await CryptoService.getFearGreedIndex();
      setFearGreedIndex(fearGreed);
      
      // Calculate market sentiment
      const sentiment = CryptoService.calculateMarketSentiment(fearGreed.value);
      setMarketSentiment(sentiment);
      
      // Get trading platforms
      const platforms = CryptoService.getTradingPlatforms();
      setTradingPlatforms(platforms);
      
      // Calculate volatility index from crypto data
      if (cryptoData.length > 0) {
        const allPrices = cryptoData.flatMap(coin => 
          coin.sparkline_in_7d?.price || []
        );
        const volatility = CryptoService.calculateVolatilityIndex(allPrices);
        setVolatilityIndex(volatility);
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    }
  }, [cryptoData]);

  useEffect(() => {
    fetchCryptoData(page);
  }, [page, fetchCryptoData]);

  useEffect(() => {
    if (cryptoData.length > 0) {
      fetchMarketData();
    }
  }, [cryptoData, fetchMarketData]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loading]);

  const formatPrice = (price: number): string => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatPercentage = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleCardClick = (coin: CryptoCoin) => {
    const url = `https://www.coingecko.com/en/coins/${coin.id}`;
    window.open(url, '_blank');
  };

  const handleAuthPrompt = () => {
    onAuthOpen?.();
  };

  if (loading && page === 1) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black mb-2">🔥 Crypto Trends</h2>
            <p className="text-gray-600">Top cryptocurrencies by market cap</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <h3 className="text-lg font-semibold text-black mb-2">Failed to load crypto trends</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => { setPage(1); fetchCryptoData(1); }}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">🔥 Crypto Trends</h2>
          <p className="text-gray-600">Top cryptocurrencies by market cap</p>
        </div>
        <button
          onClick={() => { setPage(1); fetchCryptoData(1); }}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Market Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Fear & Greed Index */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">Fear & Greed</div>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          {fearGreedIndex ? (
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{CryptoService.formatFearGreedEmoji(fearGreedIndex.value)}</span>
              <div>
                <div className={`text-xl font-bold ${CryptoService.formatFearGreedColor(fearGreedIndex.value)}`}>
                  {fearGreedIndex.value}
                </div>
                <div className="text-xs text-gray-500">{fearGreedIndex.value_classification}</div>
              </div>
            </div>
          ) : (
            <div className="text-lg font-bold text-gray-400">--</div>
          )}
        </div>

        {/* Market Sentiment */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">Sentiment</div>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-2xl ${
              marketSentiment === 'bullish' ? 'text-green-600' : 
              marketSentiment === 'bearish' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {marketSentiment === 'bullish' ? '📈' : marketSentiment === 'bearish' ? '📉' : '➡️'}
            </span>
            <div className="text-lg font-bold capitalize">{marketSentiment}</div>
          </div>
        </div>

        {/* Volatility Index */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">Volatility</div>
            <Zap className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-lg font-bold text-orange-600">
            {volatilityIndex.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500">7-day avg</div>
        </div>

        {/* Total Market Cap */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">Total Market Cap</div>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-lg font-bold text-black">
            {cryptoData.length > 0 ? CryptoService.formatMarketCap(
              cryptoData.reduce((sum, coin) => sum + coin.market_cap, 0)
            ) : '--'}
          </div>
          <div className="text-xs text-gray-500">{cryptoData.length} coins</div>
        </div>
      </div>

      {/* Trading Platforms */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Where to Buy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {tradingPlatforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <img
                  src={platform.logo}
                  alt={platform.name}
                  className="w-8 h-8 rounded"
                />
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs font-medium">{platform.rating}</span>
                </div>
              </div>
              <div className="text-sm font-semibold text-black mb-2">{platform.name}</div>
              <div className="space-y-1">
                {platform.features.slice(0, 2).map((feature, index) => (
                  <div key={index} className="text-xs text-gray-500 flex items-center">
                    <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                    {feature}
                  </div>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Crypto Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cryptoData.map((coin, index) => (
          <div
            key={coin.id}
            onClick={() => handleCardClick(coin)}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={coin.image}
                  alt={coin.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-black">{coin.name}</h3>
                  <p className="text-sm text-gray-500 uppercase">{coin.symbol}</p>
                </div>
              </div>
              
              {/* Trending Badge */}
              {index < 3 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium animate-pulse">
                  <Flame className="w-3 h-3" />
                  Trending
                </div>
              )}
            </div>

            {/* Price Info */}
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-black">
                  {formatPrice(coin.current_price)}
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {coin.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatPercentage(coin.price_change_percentage_24h)}
                </div>
              </div>

              {/* Market Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Market Cap</div>
                  <div className="font-medium text-black">
                    {CryptoService.formatMarketCap(coin.market_cap)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Volume</div>
                  <div className="font-medium text-black">
                    {CryptoService.formatVolume(coin.total_volume)}
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Circulating</div>
                  <div className="font-medium text-black">
                    {coin.circulating_supply.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">ATH</div>
                  <div className="font-medium text-black">
                    {formatPrice(coin.ath)}
                  </div>
                </div>
              </div>

              {/* Rank and Interactions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">Rank #{coin.market_cap_rank}</span>
                <InteractionButtons
                  contentType="crypto"
                  contentId={coin.id}
                  metadata={{
                    name: coin.name,
                    symbol: coin.symbol,
                    price: coin.current_price,
                    marketCap: coin.market_cap
                  }}
                  onAuthOpen={handleAuthPrompt}
                />
              </div>
            </div>
          </div>
        ))}
        {loading && page > 1 && (
          <div ref={loaderRef} className="col-span-full text-center py-8">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoTrends; 