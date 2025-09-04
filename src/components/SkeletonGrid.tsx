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
  // Generate variable heights to simulate real media cards
  const generateSkeletonItems = () => {
    const items = []
    for (let i = 0; i < rows; i++) {
      // Random heights to simulate different aspect ratios (like real media)
      const heights = [
        'h-48', 'h-56', 'h-64', 'h-52', 'h-60', 'h-44', 'h-68', 'h-50'
      ]
      const randomHeight = heights[Math.floor(Math.random() * heights.length)]
      items.push(randomHeight)
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
            {skeletonItems.map((height, itemIndex) => (
              <div 
                key={`${columnIndex}-${itemIndex}`} 
                className={`${height} bg-gray-800 animate-pulse relative overflow-hidden rounded-sm`}
              >
                {/* Subtle gradient overlay to make it look more realistic */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 opacity-50"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SkeletonGrid
