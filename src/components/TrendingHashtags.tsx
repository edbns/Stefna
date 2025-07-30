import React, { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, Hash } from 'lucide-react';
import TrendingDataService, { TrendingHashtag } from '../services/TrendingDataService';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface TrendingHashtagsProps {
  onAuthOpen?: () => void;
}

const TrendingHashtags: React.FC<TrendingHashtagsProps> = ({ onAuthOpen }) => {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHashtags();
  }, []);

  const fetchHashtags = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TrendingDataService.getTrendingHashtags();
      setHashtags(data);
    } catch (error) {
      console.error('Failed to fetch hashtags:', error);
      setError('Failed to load trending hashtags');
      toast.error('Failed to load trending hashtags');
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (hashtag: TrendingHashtag) => {
    if (hashtag.url) {
      window.open(hashtag.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-semibold text-black mb-2">Failed to load trending hashtags</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchHashtags}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">#️⃣ Trending Hashtags</h2>
          <p className="text-gray-600">Most popular hashtags across platforms</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {hashtags.length} hashtags
          </div>
          <button
            onClick={fetchHashtags}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Hashtags</div>
          <div className="text-xl font-bold text-black">{hashtags.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Mentions</div>
          <div className="text-xl font-bold text-black">
            {hashtags.reduce((sum, hashtag) => sum + hashtag.count, 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Platforms</div>
          <div className="text-xl font-bold text-black">
            {new Set(hashtags.flatMap(h => h.platform.split(', '))).size}
          </div>
        </div>
      </div>

      {/* Hashtags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hashtags.map((hashtag, index) => (
          <div
            key={hashtag.name}
            onClick={() => handleHashtagClick(hashtag)}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Hash className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-black text-lg">{hashtag.name}</h3>
                  <p className="text-sm text-gray-500">{hashtag.platform}</p>
                </div>
              </div>
              
              {/* Trending Badge */}
              {index < 5 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium animate-pulse">
                  <TrendingUp className="w-3 h-3" />
                  Hot
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Mentions</span>
                <span className="font-semibold text-black">{hashtag.count}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Platforms</span>
                <span className="text-sm text-gray-600">{hashtag.platform}</span>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-400">Click to explore</span>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {hashtags.length === 0 && !loading && (
        <div className="text-center py-20">
          <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No trending hashtags found</h3>
          <p className="text-gray-400">Check back later for the latest trending hashtags</p>
        </div>
      )}
    </div>
  );
};

export default TrendingHashtags;