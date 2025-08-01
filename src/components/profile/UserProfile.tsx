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
  ExternalLink,
  Shield,
  LogOut,
  Download,
  Upload,
  Activity,
  Target,
  Zap
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
  url?: string;
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
  status: 'active' | 'paused' | 'completed';
}

interface UserStats {
  savedContent: number;
  monitoringItems: number;
  totalEngagement: number;
  alertsThisWeek: number;
  topPlatform: string;
  favoriteCategory: string;
  weeklyGrowth: number;
  monthlyViews: number;
}

const UserProfile: React.FC<{ onAuthOpen: () => void; selectedCategory?: string }> = ({ onAuthOpen, selectedCategory = 'overview' }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'monitoring' | 'analytics' | 'settings'>('overview');
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [monitoringItems, setMonitoringItems] = useState<MonitoringItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  
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

  const [userStats, setUserStats] = useState<UserStats>({
    savedContent: 24,
    monitoringItems: 8,
    totalEngagement: 156,
    alertsThisWeek: 3,
    topPlatform: 'YouTube',
    favoriteCategory: 'Technology',
    weeklyGrowth: 12,
    monthlyViews: 2847
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockSavedContent: SavedContent[] = [
      {
        id: '1',
        title: 'AI Revolution in Social Media Marketing',
        platform: 'YouTube',
        savedAt: new Date('2024-01-15'),
        category: 'Technology',
        engagement: 92,
        thumbnail: 'https://via.placeholder.com/120x68',
        url: 'https://youtube.com/watch?v=example1'
      },
      {
        id: '2',
        title: 'Top 10 TikTok Trends This Week',
        platform: 'TikTok',
        savedAt: new Date('2024-01-14'),
        category: 'Entertainment',
        engagement: 87,
        thumbnail: 'https://via.placeholder.com/120x68',
        url: 'https://tiktok.com/@user/video/example2'
      },
      {
        id: '3',
        title: 'Reddit Discussion: Future of Social Platforms',
        platform: 'Reddit',
        savedAt: new Date('2024-01-13'),
        category: 'Discussion',
        engagement: 78,
        thumbnail: 'https://via.placeholder.com/120x68',
        url: 'https://reddit.com/r/socialmedia/comments/example3'
      },
      {
        id: '4',
        title: 'Instagram Algorithm Changes 2024',
        platform: 'Instagram',
        savedAt: new Date('2024-01-12'),
        category: 'Social Media',
        engagement: 85,
        thumbnail: 'https://via.placeholder.com/120x68',
        url: 'https://instagram.com/p/example4'
      },
      {
        id: '5',
        title: 'Twitter Marketing Strategies',
        platform: 'Twitter',
        savedAt: new Date('2024-01-11'),
        category: 'Marketing',
        engagement: 76,
        thumbnail: 'https://via.placeholder.com/120x68',
        url: 'https://twitter.com/user/status/example5'
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
        alerts: true,
        status: 'active'
      },
      {
        id: '2',
        type: 'profile',
        name: '@TechInfluencer',
        platform: 'Instagram',
        addedAt: new Date('2024-01-08'),
        lastActivity: new Date('2024-01-15'),
        engagement: 88,
        alerts: true,
        status: 'active'
      },
      {
        id: '3',
        type: 'topic',
        name: 'Social Media Marketing',
        platform: 'YouTube',
        addedAt: new Date('2024-01-05'),
        lastActivity: new Date('2024-01-14'),
        engagement: 82,
        alerts: false,
        status: 'active'
      },
      {
        id: '4',
        type: 'hashtag',
        name: '#TikTok',
        platform: 'TikTok',
        addedAt: new Date('2024-01-03'),
        lastActivity: new Date('2024-01-13'),
        engagement: 91,
        alerts: true,
        status: 'paused'
      }
    ];

    setSavedContent(mockSavedContent);
    setMonitoringItems(mockMonitoringItems);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleExportData = () => {
    // Mock export functionality
    console.log('Exporting user data...');
  };

  const handleImportData = () => {
    // Mock import functionality
    console.log('Importing user data...');
  };

  if (!user) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 bg-white">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-3">Profile Access Required</h2>
          <p className="text-gray-600 mb-8">Sign in to access your personalized dashboard, saved content, and monitoring tools.</p>
          <button
            onClick={onAuthOpen}
            className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  const filteredSavedContent = savedContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || item.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  const filteredMonitoringItems = monitoringItems.filter(item => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.platform.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-6 sm:p-8 lg:p-10 bg-white">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">{user?.name || 'User Profile'}</h1>
            <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
            <div className="flex items-center gap-2 mt-1">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Verified Account</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'saved', label: 'Saved Content', icon: Bookmark },
          { id: 'monitoring', label: 'Monitoring', icon: Eye },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
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
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <Bookmark className="w-6 h-6 text-black" />
                <div>
                  <p className="text-sm text-gray-600">Saved Content</p>
                  <p className="text-2xl font-bold text-black">{userStats.savedContent}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-black" />
                <div>
                  <p className="text-sm text-gray-600">Monitoring</p>
                  <p className="text-2xl font-bold text-black">{userStats.monitoringItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-black" />
                <div>
                  <p className="text-sm text-gray-600">Total Engagement</p>
                  <p className="text-2xl font-bold text-black">{userStats.totalEngagement}K</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
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
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-black mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {savedContent.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-black line-clamp-1">{item.title}</h4>
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
              <span className="font-medium">Add to Monitoring</span>
            </button>
            <button className="flex items-center gap-3 p-4 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors">
              <Bookmark className="w-5 h-5" />
              <span className="font-medium">Save Content</span>
            </button>
            <button className="flex items-center gap-3 p-4 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="font-medium">Set Alerts</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xl font-bold text-black">Saved Content</h3>
            <div className="flex gap-2">
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Platforms</option>
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="Reddit">Reddit</option>
                <option value="Instagram">Instagram</option>
                <option value="Twitter">Twitter</option>
              </select>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search saved content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSavedContent.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200">
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

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-600">{item.category}</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="font-semibold text-black">{item.engagement}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Saved {item.savedAt.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredSavedContent.length === 0 && (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No saved content found</h3>
              <p className="text-gray-600">Start saving content to see it here</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xl font-bold text-black">Monitoring Dashboard</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search monitoring items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMonitoringItems.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200">
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
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      item.status === 'active' ? 'text-green-600' :
                      item.status === 'paused' ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="text-gray-600">{item.lastActivity.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMonitoringItems.length === 0 && (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No monitoring items found</h3>
              <p className="text-gray-600">Start monitoring hashtags, profiles, or topics to see them here</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <h3 className="text-xl font-bold text-black">Your Analytics</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
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

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-semibold text-black mb-4">Weekly Growth</h4>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">+{userStats.weeklyGrowth}%</p>
                  <p className="text-gray-600">This week</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-semibold text-black mb-4">Monthly Views</h4>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{userStats.monthlyViews.toLocaleString()}</p>
                  <p className="text-gray-600">Total views</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold text-black mb-4">Engagement Timeline</h4>
            <div className="h-32 bg-white rounded-lg flex items-center justify-center border border-gray-200">
              <p className="text-gray-500">Chart visualization will be added here</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8">
          <h3 className="text-xl font-bold text-black">Account Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-semibold text-black mb-4">Profile Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <button className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Update Profile
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-semibold text-black mb-4">Data Management</h4>
              <div className="space-y-4">
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export My Data
                </button>
                <button
                  onClick={handleImportData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Import Data
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold text-black mb-4">Notification Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates about your monitoring items</p>
                </div>
                <button className="w-12 h-6 bg-black rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">Push Notifications</p>
                  <p className="text-sm text-gray-600">Get alerts for trending content</p>
                </div>
                <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 