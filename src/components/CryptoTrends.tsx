import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, ExternalLink, Flame } from 'lucide-react';
import CryptoService, { CryptoCoin } from '../services/CryptoService';
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

  useEffect(() => {
    fetchCryptoData(page);
  }, [page, fetchCryptoData]);

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black mb-2">🔥 Crypto Trends</h2>
            <p className="text-gray-600">Top cryptocurrencies by market cap</p>
          </div>
        </div>
        <div className="text-center py-20">
          <h3 className="text-lg font-semibold text-black mb-2">Failed to load crypto trends</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => fetchCryptoData(1)} // Retry with page 1
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
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {getTimeAgo(cryptoData[0]?.last_updated || '')}
          </div>
          <button
            onClick={() => fetchCryptoData(1)} // Refresh with page 1
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Market Cap</div>
          <div className="text-xl font-bold text-black">
            ${(cryptoData.reduce((sum, coin) => sum + coin.market_cap, 0) / 1e9).toFixed(2)}B
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">24h Volume</div>
          <div className="text-xl font-bold text-black">
            ${(cryptoData.reduce((sum, coin) => sum + coin.total_volume, 0) / 1e9).toFixed(2)}B
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Active Coins</div>
          <div className="text-xl font-bold text-black">{cryptoData.length}</div>
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
                    ${(coin.market_cap / 1e9).toFixed(2)}B
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Volume</div>
                  <div className="font-medium text-black">
                    ${(coin.total_volume / 1e6).toFixed(2)}M
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
                  onAuthOpen={() => {
                    toast.error('Please sign in to interact with content');
                    onAuthOpen?.();
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        {loading && page > 1 && (
          <div className="col-span-full text-center py-8">
            <LoadingSpinner />
          </div>
        )}
        {!hasMore && cryptoData.length > 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No more crypto trends to load.</p>
          </div>
        )}
        {error && page === 1 && (
          <div className="col-span-full text-center py-8">
            <h3 className="text-lg font-semibold text-black mb-2">Failed to load crypto trends</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => fetchCryptoData(1)} // Retry with page 1
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      {loading && page > 1 && (
        <div ref={loaderRef} className="text-center py-8">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default CryptoTrends; 