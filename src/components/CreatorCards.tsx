import React, { useState, useEffect } from 'react';
import { User, Users, Heart, Eye, ExternalLink, RefreshCw, AlertCircle, Youtube, Instagram, Twitter, PlayCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

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
  const [followedCreators, setFollowedCreators] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fallback mock creators data
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
      profileUrl: 'https://youtube.com/@techguru2024'
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
      profileUrl: 'https://tiktok.com/@dancequeen'
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
      profileUrl: 'https://instagram.com/foodie_adventures'
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
      profileUrl: 'https://youtube.com/@fitness_coach_mike'
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
      profileUrl: 'https://instagram.com/art_by_sarah'
    },
    {
      id: '6',
      username: 'comedy_central_joe',
      displayName: 'Comedy Joe',
      platform: 'tiktok',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      followerCount: 1890000,
      bio: 'Stand-up comedian & content creator',
      recentActivity: 'New comedy sketch - 5.2M views',
      verified: true,
      engagement: 18.4,
      profileUrl: 'https://tiktok.com/@comedy_central_joe'
    }
  ];

  const fetchCreators = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch from your trending service
      const response = await fetch('/.netlify/functions/trending-youtube', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        timeout: 5000
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Transform API data to creator format
        const apiCreators = result.data?.filter((item: any) => item.author)?.map((item: any, index: number) => ({
          id: `api-${index}`,
          username: item.author || `creator_${index}`,
          displayName: item.author || `Creator ${index + 1}`,
          platform: item.platform || 'youtube',
          profileImage: `https://images.unsplash.com/photo-${1472099645785 + index}?w=150&h=150&fit=crop&crop=face`,
          followerCount: Math.floor(Math.random() * 2000000) + 50000,
          bio: item.title?.substring(0, 50) + '...' || 'Content creator',
          recentActivity: `Recent: "${item.title?.substring(0, 30)}..."`,
          verified: Math.random() > 0.5,
          engagement: Math.floor(Math.random() * 20) + 5,
          profileUrl: item.url || '#'
        }));
        
        if (apiCreators && apiCreators.length > 0) {
          setCreators(apiCreators.slice(0, 12));
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
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchCreators, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
      case 'tiktok': return <PlayCircle className="w-4 h-4 text-black" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'twitter': return <Twitter className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  const handleFollow = (creatorId: string) => {
    // Check if user is authenticated before allowing follow
    if (!user) {
      onAuthOpen?.();
      return;
    }
  
    const newFollowed = new Set(followedCreators);
    if (newFollowed.has(creatorId)) {
      newFollowed.delete(creatorId);
    } else {
      newFollowed.add(creatorId);
    }
    setFollowedCreators(newFollowed);
    
    // Show toast notification
    const action = newFollowed.has(creatorId) ? 'Following' : 'Unfollowed';
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = `${action} creator!`;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const filteredCreators = selectedPlatform === 'all' 
    ? creators 
    : creators.filter(creator => creator.platform === selectedPlatform);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">👥 Trending Creators</h2>
          </div>
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">👥 Trending Creators</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Fallback</span>
            </div>
          )}
          
          <button
            onClick={fetchCreators}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-gray-500 mb-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators.map((creator) => (
          <div
            key={creator.id}
            className="group bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-indigo-100 border border-gray-200 hover:border-indigo-300 rounded-lg p-6 transition-all duration-200"
          >
            {/* Profile Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <img
                  src={creator.profileImage}
                  alt={creator.displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.displayName)}&background=6366f1&color=fff&size=64`;
                  }}
                />
                {creator.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600">
                    {creator.displayName}
                  </h3>
                  {getPlatformIcon(creator.platform)}
                </div>
                <p className="text-sm text-gray-600 truncate">@{creator.username}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mb-3 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{formatFollowerCount(creator.followerCount)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Heart className="w-4 h-4" />
                <span>{creator.engagement}%</span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
              {creator.bio}
            </p>

            {/* Recent Activity */}
            <p className="text-xs text-gray-500 mb-4 line-clamp-1">
              {creator.recentActivity}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <button
                  onClick={() => handleFollow(creator.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    followedCreators.has(creator.id)
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {followedCreators.has(creator.id) ? 'Following' : 'Follow'}
                </button>
              ) : (
                <button
                  onClick={() => onAuthOpen?.()}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Sign in to Follow
                </button>
              )}
              
              <a
                href={creator.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="View Profile"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredCreators.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No creators found for the selected platform</p>
          <button
            onClick={fetchCreators}
            className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
};

export default CreatorCards;