import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
      style={{ color: '#2a4152' }}
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform duration-200" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-200" />
      )}
    </button>
  );
};

export default ThemeToggle;