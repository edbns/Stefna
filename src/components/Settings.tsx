import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, Save, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
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
      theme: 'light',
      compactMode: false,
      animations: true
    },
    language: language
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language & Region', icon: Globe }
  ];

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{user?.name || 'Guest User'}</h3>
                <p className="text-gray-600">{user?.email || 'guest@example.com'}</p>
                <button className="text-sm text-blue-600 hover:text-blue-800 mt-1">Change Avatar</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.name || ''}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2e392e] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2e392e] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2e392e] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2e392e] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-sm text-gray-600">Receive notifications about {key.toLowerCase()}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2e392e]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                {Object.entries(settings.privacy).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-sm text-gray-600">Control your {key.toLowerCase()} settings</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleSettingChange('privacy', key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2e392e]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme</h3>
              <div className="grid grid-cols-3 gap-4">
                {['light', 'dark', 'auto'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleSettingChange('appearance', 'theme', theme)}
                    className={`p-4 border-2 rounded-lg text-center capitalize ${
                      settings.appearance.theme === theme
                        ? 'border-button bg-button text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              {Object.entries(settings.appearance).filter(([key]) => key !== 'theme').map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-sm text-gray-600">Enable {key.toLowerCase().replace('mode', ' mode')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => handleSettingChange('appearance', key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2e392e]"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Language</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-4 border-2 rounded-lg text-center ${
                    language === 'en'
                      ? 'border-button bg-button text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => setLanguage('fr')}
                  className={`p-4 border-2 rounded-lg text-center ${
                    language === 'fr'
                      ? 'border-button bg-button text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  🇫🇷 Français
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Region & Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent">
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (Central European Time)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-button" />
        <h1 className="text-3xl font-bold text-button font-['Figtree']">
          {t('nav.settings')}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#2e392e] text-[#2e392e] bg-gray-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button className="flex items-center gap-2 px-6 py-2 bg-button text-white rounded-lg hover:bg-button-hover transition-colors">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;