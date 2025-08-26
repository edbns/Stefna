import React from 'react'

interface SkeletonGridProps {
  columns?: number
  rows?: number
  className?: string
}

const SkeletonGrid: React.FC<SkeletonGridProps> = ({ 
  columns = 3, 
  rows = 6, 
  className = '' 
}) => {
  const totalItems = columns * rows

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-3 gap-1 w-full">
        {[...Array(totalItems)].map((_, index) => (
          <div 
            key={index} 
            className="aspect-square bg-gradient-to-br from-white/5 via-white/8 to-white/3 animate-pulse relative overflow-hidden group"
          >
            {/* Subtle inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Random subtle patterns for visual interest */}
            <div className="absolute inset-0 opacity-20">
              {index % 3 === 0 && (
                <div className="absolute top-2 left-2 w-8 h-8 bg-white/10 rounded-full" />
              )}
              {index % 4 === 0 && (
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-white/8 rounded" />
              )}
              {index % 5 === 0 && (
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white/6 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
            
            {/* Subtle border glow on hover */}
            <div className="absolute inset-0 border border-white/5 group-hover:border-white/10 transition-all duration-500" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default SkeletonGrid
