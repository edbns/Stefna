import React from 'react'

interface EditIconProps {
  size?: number
  className?: string
}

const EditIcon: React.FC<EditIconProps> = ({ size = 24, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 44 44" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Pen/brush body */}
      <rect x="16" y="27" width="12" height="4" rx="2" fill="currentColor"/>
      <rect x="20" y="16" width="4" height="12" rx="2" fill="currentColor"/>
      {/* Brush tip */}
      <ellipse cx="22" cy="15" rx="5" ry="2.2" fill="currentColor"/>
      {/* Spark/star accent for "AI" magic */}
      <g>
        <circle cx="30" cy="13" r="1.2" fill="currentColor"/>
        <rect x="29.2" y="11.2" width="1.6" height="3.6" rx="0.8" fill="currentColor" transform="rotate(45 30 13)"/>
        <rect x="29.2" y="11.2" width="1.6" height="3.6" rx="0.8" fill="currentColor" transform="rotate(-45 30 13)"/>
      </g>
    </svg>
  )
}

export default EditIcon 