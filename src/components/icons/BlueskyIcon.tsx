import React from 'react';

interface BlueskyIconProps {
  className?: string;
  size?: number;
}

const BlueskyIcon: React.FC<BlueskyIconProps> = ({ className = "w-5 h-5", size = 20 }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 600 530"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Official Bluesky Butterfly Logo */}
      <path d="M300 265c-82.5 0-149.5-67-149.5-149.5S217.5-34.5 300-34.5s149.5 67 149.5 149.5S382.5 265 300 265z"/>
      <path d="M300 265c-82.5 0-149.5-67-149.5-149.5S217.5-34.5 300-34.5s149.5 67 149.5 149.5S382.5 265 300 265z" fill="none" stroke="currentColor" strokeWidth="2"/>
      {/* Butterfly wings */}
      <path d="M150.5 115.5c0-82.5 67-149.5 149.5-149.5s149.5 67 149.5 149.5" fill="none" stroke="currentColor" strokeWidth="3"/>
      <path d="M150.5 115.5c0 82.5 67 149.5 149.5 149.5s149.5-67 149.5-149.5" fill="none" stroke="currentColor" strokeWidth="3"/>
      <path d="M150.5 414.5c0-82.5 67-149.5 149.5-149.5s149.5 67 149.5 149.5" fill="none" stroke="currentColor" strokeWidth="3"/>
      <path d="M150.5 414.5c0 82.5 67 149.5 149.5 149.5s149.5-67 149.5-149.5" fill="none" stroke="currentColor" strokeWidth="3"/>
    </svg>
  );
};

export default BlueskyIcon; 