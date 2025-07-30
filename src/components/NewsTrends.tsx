import React, { useState, useEffect } from 'react';
import { ExternalLink, Clock, Tag } from 'lucide-react';
import NewsService, { NewsArticle } from '../services/NewsService';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface NewsTrendsProps {
  onAuthOpen?: () => void;
}

const NewsTrends: React.FC<NewsTrendsProps> = ({ onAuthOpen }) => {
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsData();
  }, []);

  const fetchNewsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await NewsService.getTrendingNews(12);
      setNewsData(data);
    } catch (error) {
      console.error('Failed to fetch news data:', error);
      setError('Failed to load news trends');
      toast.error('Failed to load news trends');
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getCategoryLabel = (categories: string[]): string => {
    if (!categories || categories.length === 0) return 'General';
    return categories[0].charAt(0).toUpperCase() + categories[0].slice(1);
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      technology: 'bg-blue-100 text-blue-600',
      business: 'bg-green-100 text-green-600',
      sports: 'bg-orange-100 text-orange-600',
      entertainment: 'bg-purple-100 text-purple-600',
      health: 'bg-red-100 text-red-600',
      science: 'bg-indigo-100 text-indigo-600',
      general: 'bg-gray-100 text-gray-600'
    };
    return colors[category.toLowerCase()] || colors.general;
  };

  const handleCardClick = (article: NewsArticle) => {
    window.open(article.link, '_blank');
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black mb-2">📰 News Trends</h2>
            <p className="text-gray-600">Latest trending news articles</p>
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
            <h2 className="text-2xl font-bold text-black mb-2">📰 News Trends</h2>
            <p className="text-gray-600">Latest trending news articles</p>
          </div>
        </div>
        <div className="text-center py-20">
          <h3 className="text-lg font-semibold text-black mb-2">Failed to load news trends</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchNewsData}
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
          <h2 className="text-2xl font-bold text-black mb-2">📰 News Trends</h2>
          <p className="text-gray-600">Latest trending news from around the world</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {newsData.length} articles
          </div>
          <button
            onClick={fetchNewsData}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Articles</div>
          <div className="text-xl font-bold text-black">{newsData.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Categories</div>
          <div className="text-xl font-bold text-black">
            {new Set(newsData.flatMap(article => article.category)).size}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Sources</div>
          <div className="text-xl font-bold text-black">
            {new Set(newsData.map(article => article.source_id)).size}
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsData.map((article, index) => (
          <div
            key={article.link}
            onClick={() => handleCardClick(article)}
            className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            {/* Image */}
            {article.image_url && (
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute top-2 right-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(getCategoryLabel(article.category))}`}>
                    {getCategoryLabel(article.category)}
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {getTimeAgo(article.pubDate)}
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>

              {/* Title */}
              <h3 className="font-semibold text-black text-lg mb-3 line-clamp-2">
                {truncateText(article.title, 80)}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {truncateText(article.description, 120)}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{article.source_id}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {article.category.length > 0 && article.category[0]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {newsData.length >= 12 && (
        <div className="text-center mt-8">
          <button
            onClick={fetchNewsData}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsTrends; 