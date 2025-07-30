import React from 'react';

interface ContentCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

const ContentCardSkeleton: React.FC<ContentCardSkeletonProps> = ({ viewMode = 'grid' }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 h-full flex flex-col animate-pulse">
      {/* Video/Thumbnail Section Skeleton */}
      <div className="relative aspect-[16/10] bg-gray-200 overflow-hidden">
        {/* Trending Tag Skeleton - Top Left */}
        <div className="absolute top-3 left-3 z-20">
          <div className="bg-gray-300 rounded-full h-6 w-16"></div>
        </div>

        {/* Platform Icon Skeleton - Top Right */}
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-gray-300 rounded-full h-10 w-10"></div>
        </div>

        {/* Main thumbnail area */}
        <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]">
        </div>

        {/* Video Controls Skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-gray-300 rounded-full h-12 w-12"></div>
        </div>

        {/* Bottom Controls Skeleton */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <div className="bg-gray-300 rounded-lg h-6 w-6"></div>
          <div className="bg-gray-300 rounded-lg h-6 w-6"></div>
        </div>
      </div>

      {/* Content Section Skeleton */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* Creator Skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          <div className="h-3 bg-gray-300 rounded w-20"></div>
        </div>

        {/* Metrics Skeleton */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-8"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-8"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-8"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-8"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Container Skeleton */}
      <div className="px-4 pb-4">
        <div className="flex justify-center">
          <div className="bg-gray-200 rounded-full h-8 w-24 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="h-3 bg-gray-300 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCardSkeleton;