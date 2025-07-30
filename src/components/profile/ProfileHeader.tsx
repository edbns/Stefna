import React from 'react';
import { User, Edit, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProfileHeaderProps {
  onEditProfile: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  onEditProfile,
  onOpenSettings,
  onLogout
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {t('profile.notLoggedIn')}
          </h2>
          <p className="text-gray-500 mb-4">
            {t('profile.loginToView')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {user.name || 'User'}
            </h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEditProfile}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Profile"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader; 