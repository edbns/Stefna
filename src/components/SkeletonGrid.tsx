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

  // Map columns to Tailwind classes
  const getGridColsClass = (cols: number) => {
    switch (cols) {
      case 1: return 'grid-cols-1'
      case 2: return 'grid-cols-2'
      case 3: return 'grid-cols-3'
      case 4: return 'grid-cols-4'
      case 5: return 'grid-cols-5'
      case 6: return 'grid-cols-6'
      default: return 'grid-cols-3'
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div className={`grid ${getGridColsClass(columns)} gap-1 w-full`}>
        {[...Array(totalItems)].map((_, index) => (
          <div 
            key={index} 
            className="aspect-square bg-gray-800 animate-pulse relative overflow-hidden"
          >
            {/* Simple dark grey skeleton */}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SkeletonGrid
