import React from 'react'

export const AnimeDreamIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="24" cy="28" rx="12" ry="15" stroke="#FF6B9D" strokeWidth="2.5"/>
    <circle cx="24" cy="28" r="4.5" fill="#FFFFFF"/>
    <path d="M15 21 Q24 9, 33 21" stroke="#00D4FF" strokeWidth="2" fill="none"/>
    <circle cx="29" cy="24" r="2" fill="#FFFFFF" opacity="0.5"/>
  </svg>
)

export const CyberpunkNeonIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="10" y="32" width="28" height="6" rx="3" fill="#00D4FF"/>
    <rect x="16" y="24" width="16" height="5" rx="2.5" fill="#8B5CF6"/>
    <line x1="15" y1="36" x2="33" y2="12" stroke="#FF6B9D" strokeWidth="2.5"/>
    <circle cx="39" cy="34" r="3" fill="#3B82F6"/>
  </svg>
)

export const OilPaintingIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="10" y="35" width="28" height="5" rx="2.5" fill="#8B5CF6"/>
    <path d="M16 28 Q24 18, 32 28" stroke="#FF6B9D" strokeWidth="3" fill="none"/>
    <ellipse cx="24" cy="28" rx="3" ry="1.2" fill="#FFFFFF" opacity="0.7"/>
    <rect x="20" y="38" width="8" height="8" rx="4" fill="#E5E7EB"/>
  </svg>
)

export const StudioGhibliIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="24" cy="29" rx="10.5" ry="6" fill="#3B82F6"/>
    <circle cx="24" cy="20" r="7.5" fill="#8B5CF6"/>
    <ellipse cx="21" cy="20.5" rx="1.3" ry="1.7" fill="#FFFFFF"/>
    <ellipse cx="27" cy="20.5" rx="1.1" ry="1.4" fill="#FFFFFF" opacity="0.6"/>
    <path d="M24 12 Q25.5 9, 28 12" stroke="#00D4FF" strokeWidth="1.5" fill="none"/>
  </svg>
)

export const PhotorealisticIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="24" cy="24" r="15" stroke="#E5E7EB" strokeWidth="3"/>
    <circle cx="24" cy="24" r="8" stroke="#00D4FF" strokeWidth="3"/>
    <circle cx="24" cy="24" r="3.5" fill="#FFFFFF"/>
    <ellipse cx="32" cy="32" rx="3" ry="1.5" fill="#3B82F6" opacity="0.8"/>
  </svg>
)

export const WatercolorIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="24" cy="34" rx="12" ry="6" fill="#00D4FF" opacity="0.6"/>
    <ellipse cx="24" cy="22" rx="10" ry="4.8" fill="#FF6B9D" opacity="0.5"/>
    <ellipse cx="24" cy="27" rx="14" ry="7" fill="#8B5CF6" opacity="0.2"/>
  </svg>
) 