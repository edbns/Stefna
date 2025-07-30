import React, { useState, useEffect } from 'react';
import {
  User,
  Bookmark,
  Eye,
  TrendingUp,
  Settings,
  Bell,
  Calendar,
  BarChart3,
  Heart,
  MessageSquare,
  Share2,
  Clock,
  Star,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface SavedContent {
  id: string;
  title: string;
  platform: string;
  savedAt: Date;
  category: string;
  engagement: number;
  thumbnail?: string;
}

interface MonitoringItem {
  id: string;
  type: 'hashtag' | 'profile' | 'topic';
  name: string;
  platform: string;
  addedAt: Date;
  lastActivity: Date;
  engagement: number;
  alerts: boolean;
}

interface UserStats {
  savedContent: number;
  monitoringItems: number;
  totalEngagement: number;
  alertsThisWeek: number;
  topPlatform: string;
  favoriteCategory: string;
}

const UserProfile: React.FC<{ onAuthOpen: () => void; selectedCategory?: string }> = ({ onAuthOpen, selectedCategory = 'overview' }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'monitoring' | 'analytics'>('overview');
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  
  // Set active tab based on selected category
  useEffect(() => {
    if (selectedCategory === 'saved') {
      setActiveTab('saved');
    } else if (selectedCategory === 'monitoring') {
      setActiveTab('monitoring');
    } else if (selectedCategory === 'analytics') {
      setActiveTab('analytics');
    } else {
      setActiveTab('overview');
    }
  }, [selectedCategory]);
  const [monitoringItems, setMonitoringItems] = useState<MonitoringItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    savedContent: 24,
    monitoringItems: 8,
    totalEngagement: 156,
    alertsThisWeek: 3,
    topPlatform: 'YouTube',
    favoriteCategory: 'Technology'
  });

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading user data
    const mockSavedContent: SavedContent[] = [
      {
        id: '1',
        title: 'AI Revolution in Social Media Marketing',
        platform: 'YouTube',
        savedAt: new Date('2024-01-15'),
        category: 'Technology',
        engagement: 92,
        thumbnail: 'https://via.placeholder.com/120x68'
      },
      {
        id: '2',
        title: 'Top 10 TikTok Trends This Week',
        platform: 'TikTok',
        savedAt: new Date('2024-01-14'),
        category: 'Entertainment',
        engagement: 87,
        thumbnail: 'https://via.placeholder.com/120x68'
      },
      {
        id: '3',
        title: 'Reddit Discussion: Future of Social Platforms',
        platform: 'Reddit',
        savedAt: new Date('2024-01-13'),
        category: 'Discussion',
        engagement: 78,
        thumbnail: 'https://via.placeholder.com/120x68'
      }
    ];

    const mockMonitoringItems: MonitoringItem[] = [
      {
        id: '1',
        type: 'hashtag',
        name: '#AI',
        platform: 'Twitter',
        addedAt: new Date('2024-01-10'),
        lastActivity: new Date('2024-01-15'),
        engagement: 95,
        alerts: true
      },
      {
        id: '2',
        type: 'profile',
        name: '@TechInfluencer',
        platform: 'Instagram',
        addedAt: new Date('2024-01-08'),
        lastActivity: new Date('2024-01-15'),
        engagement: 88,
        alerts: true
      },
      {
        id: '3',
        type: 'topic',
        name: 'Social Media Marketing',
        platform: 'YouTube',
        addedAt: new Date('2024-01-05'),
        lastActivity: new Date('2024-01-14'),
        engagement: 82,
        alerts: false
      }
    ];

    setSavedContent(mockSavedContent);
    setMonitoringItems(mockMonitoringItems);
  }, []);

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">Profile Not Available</h2>
          <p className="text-gray-600 mb-6">Please log in to view your profile and saved content.</p>
          <button
            onClick={onAuthOpen}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* Header with Profile Icon */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">{user.name || user.email}</h1>
                            <p className="text-gray-600">Stefna Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-black" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'saved', label: 'Saved Content', icon: Bookmark },
          { id: 'monitoring', label: 'Monitoring', icon: Eye },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Bookmark className="w-6 h-6 text-black" />
                <div>
                  <p className="text-sm text-gray-600">Saved Content</p>
                  <p className="text-2xl font-bold text-black">{userStats.savedContent}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-black" />
                <div>
                  <p className="text-sm text-gray-600">Monitoring</p>
                  <p className="text-2xl font-bold text-black">{userStats.monitoringItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-black" />
                <div>
                  <p className="text-sm text-gray-600">Total Engagement</p>
                  <p className="text-2xl font-bold text-black">{userStats.totalEngagement}K</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-black" />
                <div>
                  <p className="text-sm text-gray-600">Alerts This Week</p>
                  <p className="text-2xl font-bold text-black">{userStats.alertsThisWeek}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-black mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {savedContent.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-black">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.platform} • {item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-black">{item.engagement}%</p>
                    <p className="text-xs text-gray-500">engagement</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <Plus className="w-5 h-5" />
              <span>Add to Monitoring</span>
            </button>
            <button className="flex items-center gap-3 p-4 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors">
              <Bookmark className="w-5 h-5" />
              <span>Save Content</span>
            </button>
            <button className="flex items-center gap-3 p-4 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors">
              <Bell className="w-5 h-5" />
              <span>Set Alerts</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-black">Saved Content</h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter className="w-4 h-4 text-black" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedContent.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{item.platform.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-black">{item.platform}</span>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                      <Edit className="w-3 h-3 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                      <Trash2 className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-black mb-2 line-clamp-2">{item.title}</h4>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.category}</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="font-semibold text-black">{item.engagement}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Saved {item.savedAt.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-black">Monitoring Dashboard</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monitoringItems.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === 'hashtag' ? 'bg-blue-500' :
                      item.type === 'profile' ? 'bg-green-500' : 'bg-purple-500'
                    }`}>
                      <span className="text-white text-xs font-bold">
                        {item.type === 'hashtag' ? '#' : item.type === 'profile' ? '@' : 'T'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-black">{item.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button className={`p-1 rounded transition-colors ${
                      item.alerts ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <Bell className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                      <Edit className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform:</span>
                    <span className="font-medium text-black">{item.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Engagement:</span>
                    <span className="font-semibold text-black">{item.engagement}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="text-gray-600">{item.lastActivity.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-black">Your Analytics</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-black mb-4">Top Platform</h4>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{userStats.topPlatform.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{userStats.topPlatform}</p>
                  <p className="text-gray-600">Most engaged platform</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-black mb-4">Favorite Category</h4>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{userStats.favoriteCategory}</p>
                  <p className="text-gray-600">Most saved category</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-black mb-4">Engagement Timeline</h4>
            <div className="h-32 bg-white rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart visualization will be added here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 