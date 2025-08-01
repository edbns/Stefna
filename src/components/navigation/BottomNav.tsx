import React from 'react';
import { Camera, Edit3, Users } from 'lucide-react';
import { Screen } from '../../types';

interface BottomNavProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onScreenChange }) => {
  const navItems = [
    {
      id: 'camera' as Screen,
      icon: Camera,
      label: 'Camera',
      color: 'text-purple-500'
    },
    {
      id: 'edit' as Screen,
      icon: Edit3,
      label: 'Edit',
      color: 'text-pink-500'
    },
    {
      id: 'feed' as Screen,
      icon: Users,
      label: 'Feed',
      color: 'text-indigo-500'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onScreenChange(item.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? `${item.color} bg-gray-50 scale-110` 
                  : 'text-gray-400 hover:text-gray-600 active:scale-95'
              }`}
            >
              <Icon 
                size={24} 
                className={`mb-1 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} 
              />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;