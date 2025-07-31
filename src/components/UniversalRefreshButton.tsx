import React from 'react';
import { RefreshCw } from 'lucide-react';

interface UniversalRefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  className?: string;
}

const UniversalRefreshButton: React.FC<UniversalRefreshButtonProps> = ({
  onRefresh,
  isLoading = false,
  className = ''
}) => {
  return (
    <button
      onClick={onRefresh}
      disabled={isLoading}
      className={`
        fixed bottom-6 right-6 z-50
        bg-black text-white rounded-full p-4
        shadow-lg hover:bg-gray-800 transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title="Refresh all content"
    >
      <RefreshCw 
        className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} 
      />
    </button>
  );
};

export default UniversalRefreshButton; 