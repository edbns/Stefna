import React from 'react'

interface RemixIconProps {
  size?: number
  className?: string
}

const RemixIcon: React.FC<RemixIconProps> = ({ size = 16, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main remix symbol - two larger circles with clear transformation arrows */}
      <circle 
        cx="7" 
        cy="7" 
        r="4" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
      />
      <circle 
        cx="17" 
        cy="17" 
        r="4" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
      />
      
      {/* Main transformation arrow - thicker and more visible */}
      <path 
        d="M11 7 L13 17" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
      
      {/* Secondary transformation arrow */}
      <path 
        d="M13 7 L11 17" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      
      {/* Arrow heads - larger and more prominent */}
      <path 
        d="M12 15.5 L13 17 L14 15.5" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 8.5 L11 7 L10 8.5" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Center mixing element - larger */}
      <circle 
        cx="12" 
        cy="12" 
        r="1.5" 
        fill="currentColor"
      />
      
      {/* Accent dots - larger and more visible */}
      <circle 
        cx="9" 
        cy="9" 
        r="1" 
        fill="currentColor"
      />
      <circle 
        cx="15" 
        cy="15" 
        r="1" 
        fill="currentColor"
      />
    </svg>
  )
}

export default RemixIcon 