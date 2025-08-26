import React from 'react'

interface BufferSkeletonProps {
  items: any[]
  className?: string
}

const BufferSkeleton: React.FC<BufferSkeletonProps> = ({ 
  items, 
  className = '' 
}) => {
  if (items.length === 0) return null

  return (
    <div className={`mt-4 ${className}`}>
      <div className="grid grid-cols-3 gap-1">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="aspect-square bg-gradient-to-br from-white/8 via-white/12 to-white/6 animate-pulse relative overflow-hidden group"
          >
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {/* Content preview with opacity */}
            <img 
              src={item.url} 
              alt=""
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
              loading="lazy"
            />
            
            {/* Loading overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/10" />
            
            {/* Loading indicator */}
            <div className="absolute top-2 right-2 w-3 h-3 bg-white/20 rounded-full animate-ping" />
            
            {/* Subtle border */}
            <div className="absolute inset-0 border border-white/10 group-hover:border-white/20 transition-all duration-300" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default BufferSkeleton
