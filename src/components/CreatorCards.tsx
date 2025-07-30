import React, { useState, useEffect } from 'react';
import { 
  User, 
  Users, 
  Heart, 
  Eye, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  Youtube, 
  Instagram, 
  Twitter, 
  PlayCircle,
  TrendingUp,
  Activity,
  Target,
  Sparkles,
  ArrowUpRight,
  Clock,
  Filter,
  MessageSquare,
  Share2,
  Star,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from './FollowButton';

interface Creator {
  id: string;
  username: string;
  displayName: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter';
  profileImage: string;
  followerCount: number;
  bio: string;
  recentActivity: string;
  verified: boolean;
  engagement: number;
  profileUrl: string;
  color: string;
  growth: string;
  postsThisWeek: number;
  avgViews: number;
  categories: string[];
}

interface CreatorCardsProps {
  onAuthOpen?: () => void;
  selectedPlatform?: string;
}

const CreatorCards: React.FC<CreatorCardsProps> = ({ onAuthOpen, selectedPlatform = 'all' }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Enhanced fallback creators data with colors and additional metrics
  const fallbackCreators: Creator[] = [
    {
      id: '1',
      username: 'techguru2024',
      displayName: 'Tech Guru',
      platform: 'youtube',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      followerCount: 1250000,
      bio: 'Latest tech reviews and tutorials',
      recentActivity: 'Posted: "iPhone 16 Review" 2 hours ago',
      verified: true,
      engagement: 8.5,
      profileUrl: 'https://youtube.com/@techguru2024',
      color: '#FF0000',
      growth: '+23%',
      postsThisWeek: 5,
      avgViews: 850000,
      categories: ['Technology', 'Reviews', 'Tutorials']
    },
    {
      id: '2',
      username: 'dancequeen',
      displayName: 'Dance Queen',
      platform: 'tiktok',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      followerCount: 890000,
      bio: 'Professional dancer & choreographer',
      recentActivity: 'Viral dance trend - 2.3M views',
      verified: true,
      engagement: 12.3,
      profileUrl: 'https://tiktok.com/@dancequeen',
      color: '#000000',
      growth: '+45%',
      postsThisWeek: 12,
      avgViews: 1200000,
      categories: ['Dance', 'Entertainment', 'Trends']
    },
    {
      id: '3',
      username: 'foodie_adventures',
      displayName: 'Foodie Adventures',
      platform: 'instagram',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      followerCount: 567000,
      bio: 'Exploring cuisines around the world',
      recentActivity: 'New post: "Tokyo Street Food" 1 hour ago',
      verified: false,
      engagement: 9.7,
      profileUrl: 'https://instagram.com/foodie_adventures',
      color: '#E4405F',
      growth: '+18%',
      postsThisWeek: 8,
      avgViews: 450000,
      categories: ['Food', 'Travel', 'Lifestyle']
    },
    {
      id: '4',
      username: 'fitness_coach_mike',
      displayName: 'Coach Mike',
      platform: 'youtube',
      profileImage: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face',
      followerCount: 423000,
      bio: 'Certified personal trainer & nutritionist',
      recentActivity: 'Live workout session starting soon',
      verified: true,
      engagement: 11.2,
      profileUrl: 'https://youtube.com/@fitness_coach_mike',
      color: '#FF0000',
      growth: '+32%',
      postsThisWeek: 3,
      avgViews: 320000,
      categories: ['Fitness', 'Health', 'Workouts']
    },
    {
      id: '5',
      username: 'art_by_sarah',
      displayName: 'Sarah Art',
      platform: 'instagram',
      profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      followerCount: 234000,
      bio: 'Digital artist & illustrator',
      recentActivity: 'Speed painting video - 45K likes',
      verified: false,
      engagement: 15.8,
      profileUrl: 'https://instagram.com/art_by_sarah',
      color: '#E4405F',
      growth: '+67%',
      postsThisWeek: 15,
      avgViews: 180000,
      categories: ['Art', 'Design', 'Creative']
    },
    {
      id: '6',
      username: 'gaming_pro',
      displayName: 'Gaming Pro',
      platform: 'youtube',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      followerCount: 890000,
      bio: 'Professional gamer & streamer',
      recentActivity: 'Live stream: "Fortnite Tournament"',
      verified: true,
      engagement: 14.2,
      profileUrl: 'https://youtube.com/@gaming_pro',
      color: '#FF0000',
      growth: '+89%',
      postsThisWeek: 7,
      avgViews: 950000,
      categories: ['Gaming', 'Esports', 'Streaming']
    },
    {
      id: '7',
      username: 'fashion_icon',
      displayName: 'Fashion Icon',
      platform: 'instagram',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      followerCount: 678000,
      bio: 'Fashion influencer & style consultant',
      recentActivity: 'OOTD post - 125K likes',
      verified: true,
      engagement: 13.5,
      profileUrl: 'https://instagram.com/fashion_icon',
      color: '#E4405F',
      growth: '+28%',
      postsThisWeek: 10,
      avgViews: 520000,
      categories: ['Fashion', 'Style', 'Lifestyle']
    },
    {
      id: '8',
      username: 'music_maker',
      displayName: 'Music Maker',
      platform: 'tiktok',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      followerCount: 456000,
      bio: 'Original music & covers',
      recentActivity: 'New song release - 890K views',
      verified: false,
      engagement: 16.8,
      profileUrl: 'https://tiktok.com/@music_maker',
      color: '#000000',
      growth: '+56%',
      postsThisWeek: 6,
      avgViews: 680000,
      categories: ['Music', 'Covers', 'Original']
    }
  ];

  const fetchCreators = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try your local trending service first
      const response = await fetch('/.netlify/functions/trending-youtube', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Transform API data to creators
        const apiCreators = result.data?.reduce((acc: any[], item: any) => {
          const creator = {
            id: `api-${acc.length}`,
            username: item.channelTitle || `creator${acc.length}`,
            displayName: item.channelTitle || `Creator ${acc.length}`,
            platform: 'youtube' as const,
            profileImage: item.thumbnail || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            followerCount: Math.floor(Math.random() * 2000000) + 100000,
            bio: item.description?.slice(0, 100) || 'Content creator',
            recentActivity: `Posted: "${item.title}" ${Math.floor(Math.random() * 24)} hours ago`,
            verified: Math.random() > 0.5,
            engagement: Math.floor(Math.random() * 20) + 5,
            profileUrl: `https://youtube.com/@${item.channelTitle}`,
            color: '#FF0000',
            growth: `+${Math.floor(Math.random() * 80) + 10}%`,
            postsThisWeek: Math.floor(Math.random() * 20) + 1,
            avgViews: Math.floor(Math.random() * 2000000) + 100000,
            categories: ['Content', 'Entertainment', 'Viral']
          };
          
          acc.push(creator);
          return acc;
        }, []);
        
        if (apiCreators && apiCreators.length > 0) {
          setCreators(apiCreators.slice(0, 8));
          setLastUpdated(new Date());
        } else {
          throw new Error('No creators in API response');
        }
      } else {
        throw new Error('API request failed');
      }
      
    } catch (err) {
      console.error('Error fetching creators:', err);
      setError('Using fallback data');
      setCreators(fallbackCreators);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [selectedTimeframe]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return Youtube;
      case 'instagram': return Instagram;
      case 'twitter': return Twitter;
      case 'tiktok': return PlayCircle;
      default: return User;
    }
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleCreatorClick = (creator: Creator) => {
    window.open(creator.profileUrl, '_blank');
  };

  const timeframes = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  const filters = [
    { value: 'all', label: 'All Creators' },
    { value: 'verified', label: 'Verified Only' },
    { value: 'high-engagement', label: 'High Engagement' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' }
  ];

  const filteredCreators = creators.filter(creator => {
    if (selectedFilter === 'verified') return creator.verified;
    if (selectedFilter === 'high-engagement') return creator.engagement > 12;
    if (selectedFilter === 'youtube') return creator.platform === 'youtube';
    if (selectedFilter === 'instagram') return creator.platform === 'instagram';
    if (selectedFilter === 'tiktok') return creator.platform === 'tiktok';
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Trending Creators</h1>
          <p className="text-gray-600">Discover the most popular content creators across all platforms</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated?.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={fetchCreators}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Timeframe:</span>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          >
            {timeframes.map(timeframe => (
              <option key={timeframe.value} value={timeframe.value}>
                {timeframe.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          >
            {filters.map(filter => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Total Followers</p>
              <p className="text-2xl font-bold">{formatFollowerCount(creators.reduce((sum, creator) => sum + creator.followerCount, 0))}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Avg Engagement</p>
              <p className="text-2xl font-bold">{((creators.reduce((sum, creator) => sum + creator.engagement, 0) / creators.length) || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Verified Creators</p>
              <p className="text-2xl font-bold">{creators.filter(c => c.verified).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Top Growth</p>
              <p className="text-2xl font-bold">+89%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators.map((creator) => {
          const PlatformIcon = getPlatformIcon(creator.platform);
          
          return (
            <div
              key={creator.id}
              className="group relative bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => handleCreatorClick(creator)}
            >
              {/* Creator Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={creator.profileImage}
                      alt={creator.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {creator.verified && (
                      <CheckCircle className="w-4 h-4 text-blue-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">{creator.displayName}</h3>
                    <p className="text-sm text-gray-500">@{creator.username}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              </div>

              {/* Platform and Bio */}
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${creator.color}20`, color: creator.color }}
                >
                  <PlatformIcon className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-600 capitalize">{creator.platform}</span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{creator.bio}</p>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Followers</p>
                  <p className="text-lg font-semibold text-black">{formatFollowerCount(creator.followerCount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Engagement</p>
                  <p className="text-lg font-semibold text-black">{creator.engagement}%</p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Avg Views</p>
                    <p className="text-sm font-medium text-black">{formatFollowerCount(creator.avgViews)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Posts/Week</p>
                    <p className="text-sm font-medium text-black">{creator.postsThisWeek}</p>
                  </div>
                </div>
              </div>

              {/* Growth and Categories */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">{creator.growth}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">{creator.engagement > 12 ? 'High' : 'Medium'}</span>
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Categories:</p>
                <div className="flex flex-wrap gap-1">
                  {creator.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Recent Activity:</p>
                <p className="text-sm text-gray-700 line-clamp-2">{creator.recentActivity}</p>
              </div>

              {/* Follow Button */}
              {user && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <FollowButton
                    type="creator"
                    item={creator.username}
                    onAuthRequired={onAuthOpen}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorCards;