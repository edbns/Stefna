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
  // Generate skeleton items (total items = columns * rows)
  const totalItems = columns * rows;
  const skeletonItems = Array.from({ length: totalItems }, (_, i) => i);

  // Map column numbers to Tailwind classes (explicit for Tailwind JIT)
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[columns] || 'grid-cols-3';

  return (
    <div className={`w-full ${className}`}>
      {/* Use CSS Grid to match the actual gallery layout */}
      <div className={`grid ${gridColsClass} gap-3`}>
        {skeletonItems.map((itemIndex) => (
          <div 
            key={itemIndex} 
            className="aspect-square bg-white/5 animate-pulse relative overflow-hidden w-full"
          >
            {/* Subtle gradient overlay to make it look more realistic */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 opacity-50"></div>
            {/* Add a subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SkeletonGrid
