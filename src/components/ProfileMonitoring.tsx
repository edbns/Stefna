import React, { useState, useEffect } from 'react';
import { User, TrendingUp, Users, Heart, MessageCircle, Plus, Search, Bell, Settings, BarChart3, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MonitoredProfile {
  id: string;
  username: string;
  displayName: string;
  platform: 'youtube' | 'tiktok' | 'twitter' | 'instagram';
  avatar: string;
  verified: boolean;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  followerGrowth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  recentActivity: {
    lastPost: string;
    postsThisWeek: number;
    avgLikes: number;
    avgComments: number;
  };
  alerts: {
    followerSpike: boolean;
    viralContent: boolean;
    engagementDrop: boolean;
  };
  addedAt: string;
}

const ProfileMonitoring: React.FC = () => {
  const { t } = useLanguage();
  const [monitoredProfiles, setMonitoredProfiles] = useState<MonitoredProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfileData, setNewProfileData] = useState({
    username: '',
    platform: 'youtube' as const
  });

  // Remove mock data for demonstration
  useEffect(() => {
    const fetchMonitoredProfiles = async () => {
      try {
        // Only fetch real data
        const profiles = await profileService.getMonitoredProfiles();
        setMonitoredProfiles(profiles || []);
      } catch (err) {
        console.error('Error fetching monitored profiles:', err);
        setMonitoredProfiles([]); // Set empty array instead of mock data
      }
    };

    fetchMonitoredProfiles();
  }, []);

  const handleAddProfile = async () => {
    if (newProfileData.username) {
      try {
        // Make real API call to add profile
        const newProfile = await profileService.addProfile(newProfileData);
        setMonitoredProfiles(prev => [...prev, newProfile]);
        setNewProfileData({ username: '', platform: 'youtube' });
        setShowAddModal(false);
      } catch (err) {
        console.error('Error adding profile:', err);
        // Handle error appropriately
      }
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'text-red-600 bg-red-50';
      case 'tiktok': return 'text-black bg-gray-50';
      case 'twitter': return 'text-blue-500 bg-blue-50';
      case 'instagram': return 'text-pink-600 bg-pink-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const filteredProfiles = monitoredProfiles.filter(profile => {
    const matchesSearch = profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || profile.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-button" />
          <h1 className="text-3xl font-bold text-button font-['Figtree']">
            Profile Monitoring
          </h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-button text-white px-4 py-2 rounded-lg hover:bg-button/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Profile
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
          />
        </div>
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
        >
          <option value="all">All Platforms</option>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
          <option value="twitter">Twitter/X</option>
          <option value="instagram">Instagram</option>
        </select>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProfiles.map((profile) => (
          <div key={profile.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {/* Profile Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={profile.avatar}
                  alt={profile.displayName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{profile.displayName}</h3>
                    {profile.verified && <span className="text-blue-500">✓</span>}
                  </div>
                  <p className="text-gray-600 text-sm">{profile.username}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(profile.platform)}`}>
                    {profile.platform}
                  </span>
                </div>
              </div>
              
              {/* Alerts */}
              <div className="flex gap-1">
                {profile.alerts.followerSpike && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Follower spike detected" />
                )}
                {profile.alerts.viralContent && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" title="Viral content detected" />
                )}
                {profile.alerts.engagementDrop && (
                  <div className="w-2 h-2 bg-red-500 rounded-full" title="Engagement drop detected" />
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{formatNumber(profile.followers)}</div>
                <div className="text-xs text-gray-600">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{profile.posts}</div>
                <div className="text-xs text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{profile.engagementRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-600">Engagement</div>
              </div>
            </div>

            {/* Growth Metrics */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Daily Growth:</span>
                <span className="font-medium text-green-600">+{formatNumber(profile.followerGrowth.daily)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Weekly Growth:</span>
                <span className="font-medium text-green-600">+{formatNumber(profile.followerGrowth.weekly)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Post:</span>
                <span className="font-medium">{profile.recentActivity.lastPost}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Bell className="w-4 h-4" />
                Alerts
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Profile to Monitor</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  placeholder="@username"
                  value={newProfileData.username}
                  onChange={(e) => setNewProfileData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <select
                  value={newProfileData.platform}
                  onChange={(e) => setNewProfileData(prev => ({ ...prev, platform: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
                >
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProfile}
                className="flex-1 px-4 py-2 bg-button text-white rounded-lg hover:bg-button/90 transition-colors"
              >
                Add Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMonitoring;


// Add monitoring limits and premium features
const MAX_FREE_PROFILES = 3;
const { user } = useAuth();
const freeProfilesUsed = monitoredProfiles.length;

// Add premium monitoring section:
<PremiumFeatureGate
  feature="Unlimited Profile Monitoring"
  description="Monitor unlimited profiles with advanced alerts and analytics"
  onAuthPrompt={onAuthOpen}
  showTeaser={freeProfilesUsed >= MAX_FREE_PROFILES}
  teaserContent={
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 opacity-60">
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Monitor More Profiles</h3>
        <p className="text-gray-600">Track competitors and influencers</p>
      </div>
    </div>
  }
>
  {/* Premium monitoring features */}
</PremiumFeatureGate>