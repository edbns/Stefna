import React, { useState, useEffect } from 'react';
import { Bell, TrendingUp, Users, AlertTriangle, CheckCircle, X, Settings, Filter } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Notification {
  id: string;
  type: 'follower_spike' | 'viral_content' | 'engagement_drop' | 'new_trend' | 'profile_update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedEntity: {
    type: 'profile' | 'trend' | 'content';
    id: string;
    name: string;
  };
  actionUrl?: string;
}

const Notifications: React.FC = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    followerSpikes: true,
    viralContent: true,
    engagementDrops: true,
    newTrends: true,
    profileUpdates: false,
    emailNotifications: true,
    pushNotifications: false,
    frequency: 'realtime' // realtime, hourly, daily
  });

  // Mock notifications data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'follower_spike',
        title: 'Follower Spike Detected',
        message: '@techguru gained 5,000 followers in the last hour (+15% spike)',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        read: false,
        priority: 'high',
        relatedEntity: {
          type: 'profile',
          id: '1',
          name: '@techguru'
        }
      },
      {
        id: '2',
        type: 'viral_content',
        title: 'Viral Content Alert',
        message: '@dancequeen\'s latest TikTok reached 1M views in 6 hours',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        read: false,
        priority: 'high',
        relatedEntity: {
          type: 'profile',
          id: '2',
          name: '@dancequeen'
        }
      },
      {
        id: '3',
        type: 'new_trend',
        title: 'New Trending Topic',
        message: '#SustainableTech is gaining momentum with 2,500 new posts today',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        read: true,
        priority: 'medium',
        relatedEntity: {
          type: 'trend',
          id: '3',
          name: '#SustainableTech'
        }
      },
      {
        id: '4',
        type: 'engagement_drop',
        title: 'Engagement Drop Warning',
        message: '#SustainableFashion engagement dropped by 25% in the last 24 hours',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        read: true,
        priority: 'medium',
        relatedEntity: {
          type: 'trend',
          id: '2',
          name: '#SustainableFashion'
        }
      },
      {
        id: '5',
        type: 'profile_update',
        title: 'Profile Update',
        message: '@techguru updated their bio and added a new link',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        read: true,
        priority: 'low',
        relatedEntity: {
          type: 'profile',
          id: '1',
          name: '@techguru'
        }
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follower_spike': return <Users className="w-5 h-5 text-green-600" />;
      case 'viral_content': return <TrendingUp className="w-5 h-5 text-orange-600" />;
      case 'engagement_drop': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'new_trend': return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'profile_update': return <Users className="w-5 h-5 text-gray-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-gray-300';
      default: return 'border-l-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-8 h-8 text-button" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-button font-['Figtree']">
            Notifications
          </h1>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
          { value: 'follower_spike', label: 'Follower Spikes' },
          { value: 'viral_content', label: 'Viral Content' },
          { value: 'engagement_drop', label: 'Engagement Drops' },
          { value: 'new_trend', label: 'New Trends' }
        ].map((filterOption) => (
          <button
            key={filterOption.value}
            onClick={() => setFilter(filterOption.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === filterOption.value
                ? 'bg-button text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${getPriorityColor(notification.priority)} ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatTimestamp(notification.timestamp)}</span>
                      <span className="capitalize">{notification.relatedEntity.type}: {notification.relatedEntity.name}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                        notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Alert Types</h3>
                <div className="space-y-2">
                  {[
                    { key: 'followerSpikes', label: 'Follower Spikes' },
                    { key: 'viralContent', label: 'Viral Content' },
                    { key: 'engagementDrops', label: 'Engagement Drops' },
                    { key: 'newTrends', label: 'New Trends' },
                    { key: 'profileUpdates', label: 'Profile Updates' }
                  ].map((setting) => (
                    <label key={setting.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{setting.label}</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings[setting.key as keyof typeof notificationSettings] as boolean}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          [setting.key]: e.target.checked
                        }))}
                        className="rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Delivery</h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Email Notifications</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        emailNotifications: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Push Notifications</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        pushNotifications: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={notificationSettings.frequency}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    frequency: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly digest</option>
                  <option value="daily">Daily digest</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-button text-white rounded-lg hover:bg-button/90 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;