import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right'
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage: (performance as any).memory ? 
            Math.round((performance as any).memory.usedJSHeapSize / 1048576) : 0,
          loadTime: Math.round(performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0),
          renderTime: Math.round(performance.now())
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getPerformanceColor = (value: number, type: 'fps' | 'memory') => {
    if (type === 'fps') {
      if (value >= 55) return 'text-green-600';
      if (value >= 30) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value <= 50) return 'text-green-600';
      if (value <= 100) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsVisible(!isVisible)}
        className="w-12 h-12 rounded-full bg-black bg-opacity-70 text-white flex items-center justify-center text-xs font-mono"
        style={{ fontFamily: 'Figtree, monospace' }}
      >
        {metrics.fps}
      </motion.button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-14 right-0 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs font-mono min-w-[200px]"
            style={{ fontFamily: 'Figtree, monospace' }}
          >
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>FPS:</span>
                <span className={getPerformanceColor(metrics.fps, 'fps')}>
                  {metrics.fps}
                </span>
              </div>
              
              {(performance as any).memory && (
                <div className="flex justify-between">
                  <span>Memory:</span>
                  <span className={getPerformanceColor(metrics.memoryUsage, 'memory')}>
                    {metrics.memoryUsage}MB
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Load:</span>
                <span className="text-blue-400">{metrics.loadTime}ms</span>
              </div>
              
              <div className="flex justify-between">
                <span>Runtime:</span>
                <span className="text-purple-400">{Math.round(metrics.renderTime / 1000)}s</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformanceMonitor;