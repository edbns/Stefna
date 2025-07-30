import React, { useState } from 'react';
import { User, Calendar, BarChart3, Users, Grid, Settings } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import ProfileSettings from './ProfileSettings';
import CustomDashboards from '../CustomDashboards';
import Audience from '../Audience';
import Analytics from '../Analytics';

interface UserProfileProps {
  onAuthOpen?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onAuthOpen = () => {} }) => {
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      trending: true,
      analytics: false
    },
    privacy: {
      profilePublic: false,
      showActivity: true,
      dataSharing: false
    },
    appearance: {
      theme: 'light' as const,
      compactMode: false,
      animations: true
    },
    language: language
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'content-planner', label: 'Content Planner', icon: Calendar },
    { id: 'dashboards', label: 'Custom Dashboards', icon: Grid },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleEditProfile = () => {
    // TODO: Implement edit profile functionality
    console.log('Edit profile clicked');
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleLogout = () => {
    logout();
  };

  const handleSettingsChange = (newSettings: typeof settings) => {
    setSettings(newSettings);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <ProfileStats />
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📊</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Analytics report generated</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📝</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">New post scheduled</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🎯</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Trending content analyzed</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return <Analytics />;

      case 'audience':
        return <Audience />;

      case 'content-planner':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Content Planner</h3>
            <p className="text-gray-600">Content planning features coming soon...</p>
          </div>
        );

      case 'dashboards':
        return <CustomDashboards />;

      case 'settings':
        return (
          <ProfileSettings 
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            {t('profile.notLoggedIn')}
          </h2>
          <p className="text-gray-500 mb-6">
            {t('profile.loginToView')}
          </p>
          <button
            onClick={onAuthOpen}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ProfileHeader
        onEditProfile={handleEditProfile}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
      />

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 