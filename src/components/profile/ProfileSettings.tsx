import React, { useState } from 'react';
import { Bell, Shield, Palette, Globe, Save, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    trending: boolean;
    analytics: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showActivity: boolean;
    dataSharing: boolean;
  };
  appearance: {
    theme: 'light' | 'dark';
    compactMode: boolean;
    animations: boolean;
  };
  language: string;
}

interface ProfileSettingsProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('notifications');
  const [showPassword, setShowPassword] = useState(false);

  const settingsTabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language & Region', icon: Globe }
  ];

  const handleSettingChange = (category: keyof Settings, setting: string, value: any) => {
    onSettingsChange({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value
      }
    });
  };

  const renderNotificationsSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-800">Email Notifications</h3>
          <p className="text-sm text-gray-600">Receive updates via email</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.notifications.email}
            onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-800">Push Notifications</h3>
          <p className="text-sm text-gray-600">Receive real-time notifications</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.notifications.push}
            onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-800">Trending Alerts</h3>
          <p className="text-sm text-gray-600">Get notified about trending content</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.notifications.trending}
            onChange={(e) => handleSettingChange('notifications', 'trending', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-800">Public Profile</h3>
          <p className="text-sm text-gray-600">Allow others to view your profile</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.privacy.profilePublic}
            onChange={(e) => handleSettingChange('privacy', 'profilePublic', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-800">Show Activity</h3>
          <p className="text-sm text-gray-600">Display your recent activity</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.privacy.showActivity}
            onChange={(e) => handleSettingChange('privacy', 'showActivity', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-3">Theme</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={settings.appearance.theme === 'light'}
              onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
              className="mr-2"
            />
            Light Mode
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={settings.appearance.theme === 'dark'}
              onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
              className="mr-2"
            />
            Dark Mode
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-800">Compact Mode</h3>
          <p className="text-sm text-gray-600">Reduce spacing for more content</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.appearance.compactMode}
            onChange={(e) => handleSettingChange('appearance', 'compactMode', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-3">Language</h3>
        <select
          value={settings.language}
          onChange={(e) => {
            const newLanguage = e.target.value;
            handleSettingChange('language', 'language', newLanguage);
            setLanguage(newLanguage);
          }}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="it">Italiano</option>
          <option value="pt">Português</option>
          <option value="ru">Русский</option>
          <option value="zh">中文</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {settingsTabs.map((tab) => (
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
        {activeTab === 'notifications' && renderNotificationsSettings()}
        {activeTab === 'privacy' && renderPrivacySettings()}
        {activeTab === 'appearance' && renderAppearanceSettings()}
        {activeTab === 'language' && renderLanguageSettings()}
      </div>
    </div>
  );
};

export default ProfileSettings; 