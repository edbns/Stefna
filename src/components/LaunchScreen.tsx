import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Globe, Zap, Target, BarChart3 } from 'lucide-react';

interface LaunchScreenProps {
  onComplete: () => void;
}

const LaunchScreen: React.FC<LaunchScreenProps> = ({ onComplete }) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number }>>([]);

  // Generate particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 1 + 0.3
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    // Phase 1: Initial animation (0.5s)
    const phase1 = setTimeout(() => setCurrentPhase(1), 500);
    // Phase 2: Logo reveal (0.8s)
    const phase2 = setTimeout(() => setCurrentPhase(2), 1300);
    // Phase 3: Features animation (0.5s)
    const phase3 = setTimeout(() => setCurrentPhase(3), 1800);
    // Phase 4: Completion (0.2s)
    const phase4 = setTimeout(() => onComplete(), 2000);

    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
      clearTimeout(phase3);
      clearTimeout(phase4);
    };
  }, [onComplete]);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: particle.y - particle.speed,
        x: particle.x + Math.sin(particle.y / 150) * 0.2
      })).filter(particle => particle.y > -50));
    }, 60);

    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: TrendingUp, label: 'Trending', color: 'from-gray-600 to-gray-800' },
    { icon: Globe, label: 'Global', color: 'from-gray-700 to-gray-900' },
    { icon: Zap, label: 'Real-time', color: 'from-gray-500 to-gray-700' },
    { icon: Target, label: 'Intelligence', color: 'from-gray-800 to-black' },
    { icon: BarChart3, label: 'Analytics', color: 'from-gray-600 to-gray-800' }
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center z-50 overflow-hidden font-figtree">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200/20 via-gray-300/20 to-gray-200/20 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/3 to-transparent" />
      </div>

      {/* Floating Particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-black/15 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size
          }}
          animate={{
            opacity: [0.1, 0.4, 0.1],
            scale: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Subtle Morphing Shapes */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-gray-200/40 to-gray-300/40 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 45, 90],
            borderRadius: ["50%", "45%", "50%"]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-gray-300/40 to-gray-400/40 rounded-full blur-2xl"
          animate={{
            scale: [1.05, 1, 1.05],
            rotate: [90, 45, 0],
            borderRadius: ["45%", "50%", "45%"]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        <AnimatePresence mode="wait">
          {currentPhase === 0 && (
            <motion.div
              key="phase0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-800 to-black rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-lg font-light text-gray-600">Initializing Stefna</h2>
            </motion.div>
          )}

          {currentPhase === 1 && (
            <motion.div
              key="phase1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <motion.h1
                className="text-4xl md:text-6xl font-bold text-black tracking-wide"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                Stefna
              </motion.h1>
              <motion.p
                className="text-base text-gray-500 font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                Discover What's Trending Worldwide
              </motion.p>
            </motion.div>
          )}

          {currentPhase === 2 && (
            <motion.div
              key="phase2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <motion.div
                className="flex items-center justify-center space-x-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    className="flex flex-col items-center space-y-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                  >
                    <div className={`w-8 h-8 bg-gradient-to-r ${feature.color} rounded-md flex items-center justify-center`}>
                      <feature.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{feature.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {currentPhase === 3 && (
            <motion.div
              key="phase3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <motion.div
                className="flex justify-center"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-gray-800 to-black rounded-full flex items-center justify-center">
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </motion.div>
              <motion.p
                className="text-sm text-gray-500 font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Ready to explore trends...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-40 h-0.5 bg-gray-300 rounded-full overflow-hidden"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-gray-800 to-black"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
};

export default LaunchScreen;