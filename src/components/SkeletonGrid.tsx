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
      {/* Use same masonry structure as MasonryMediaGrid */}
      <div className="flex gap-1 w-full" style={{ maxWidth: '100%' }}>
        {[...Array(columns)].map((_, columnIndex) => (
          <div key={columnIndex} className="flex-1 flex flex-col gap-1 min-w-0">
            {skeletonItems.map((aspectClass, itemIndex) => (
              <div 
                key={`${columnIndex}-${itemIndex}`} 
                className={`${aspectClass} bg-gray-800 animate-pulse relative overflow-hidden rounded-sm w-full`}
                style={{ 
                  width: '100%',
                  flexShrink: 0
                }}
              >
                {/* Subtle gradient overlay to make it look more realistic */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 opacity-50"></div>
                {/* Add a subtle shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SkeletonGrid
