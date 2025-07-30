import React, { Suspense, lazy, ComponentType } from 'react';
import { motion } from 'framer-motion';
import { EnhancedSkeleton } from './EnhancedSkeleton';

interface LazyWrapperProps {
  importFunc: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({
  importFunc,
  fallback,
  errorFallback,
  className = '',
  ...props
}) => {
  const LazyComponent = lazy(importFunc);

  const defaultFallback = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-6 ${className}`}
      style={{ fontFamily: 'Figtree, sans-serif' }}
    >
      <EnhancedSkeleton variant="card" />
    </motion.div>
  );

  const defaultErrorFallback = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-6 rounded-lg border border-red-200 bg-red-50 ${className}`}
      style={{ fontFamily: 'Figtree, sans-serif' }}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium" style={{ color: '#2a4152' }}>Failed to load component</h3>
          <p className="text-xs text-gray-600 mt-1">Please try refreshing the page</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default LazyWrapper;