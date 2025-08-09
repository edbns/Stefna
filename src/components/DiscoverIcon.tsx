import React from 'react'

interface DiscoverIconProps {
  size?: number
  className?: string
}

const DiscoverIcon: React.FC<DiscoverIconProps> = ({ size = 24, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 44 44" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="22" cy="22" r="12" stroke="currentColor" strokeWidth="2.2" fill="none"/>
      <polygon points="22,13 26,27 22,24 18,27" fill="currentColor"/>
    </svg>
  )
}

export default DiscoverIcon 