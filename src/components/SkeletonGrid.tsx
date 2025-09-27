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
  // Generate unified 1:1 square skeleton items
  const generateSkeletonItems = () => {
    const items = []
    for (let i = 0; i < rows; i++) {
      // All items are 1:1 square format for consistency
      items.push('aspect-square')
    }
    return items
  }

  const skeletonItems = generateSkeletonItems()

  return (
    <div className={`w-full ${className}`}>
      {/* Use same masonry structure as the actual media layout */}
      <div className={`columns-${columns} gap-1`}>
        {skeletonItems.map((aspectClass, itemIndex) => (
          <div 
            key={itemIndex} 
            className={`${aspectClass} bg-white/5 animate-pulse relative overflow-hidden w-full break-inside-avoid mb-1`}
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
