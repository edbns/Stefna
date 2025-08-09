import React from 'react'

interface ProfileIconProps {
  size?: number
  className?: string
}

const ProfileIcon: React.FC<ProfileIconProps> = ({ size = 24, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 44 44" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Head */}
      <circle cx="22" cy="18" r="6" fill="currentColor"/>
      {/* Shoulders/chest */}
      <ellipse cx="22" cy="29" rx="10" ry="5" fill="currentColor"/>
    </svg>
  )
}

export default ProfileIcon 