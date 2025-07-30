import React from 'react';

interface SkeletonProps {
  variant?: 'card' | 'text' | 'avatar' | 'button';
  width?: string;
  height?: string;
  className?: string;
}

const EnhancedSkeleton: React.FC<SkeletonProps> = ({ 
  variant = 'text', 
  width = 'w-full', 
  height = 'h-4', 
  className = '' 
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded';
  
  const variants = {
    card: 'h-48 rounded-xl',
    text: 'h-4 rounded',
    avatar: 'w-10 h-10 rounded-full',
    button: 'h-10 rounded-lg'
  };
  
  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${width} ${height} ${className}`}
      style={{
        background: 'linear-gradient(90deg, #eee9dd 0%, #e0d9ca 50%, #eee9dd 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite'
      }}
    />
  );
};

export default EnhancedSkeleton;