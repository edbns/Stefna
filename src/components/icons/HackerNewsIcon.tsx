import React from 'react';

interface HackerNewsIconProps {
  className?: string;
  size?: number;
}

const HackerNewsIcon: React.FC<HackerNewsIconProps> = ({ className = "w-5 h-5", size = 20 }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hacker News "Y" Logo */}
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
      <path d="M12 4L4 8v8l8 4 8-4V8L12 4z" fill="white"/>
      <path d="M12 6L6 9v6l6 3 6-3V9L12 6z" fill="currentColor"/>
      <path d="M12 8L8 10v4l4 2 4-2V10L12 8z" fill="white"/>
    </svg>
  );
};

export default HackerNewsIcon; 