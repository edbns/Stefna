import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Error404: React.FC = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md mx-auto text-center px-6">
        {/* Alegria-style Illustration */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Main Circle */}
            <div className="absolute inset-0 bg-black rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            
            {/* Decorative Elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-black"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-black rounded-full border-2 border-white"
            />
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-4 left-4 w-3 h-3 bg-white rounded-full"
            />
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-black mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-black mb-3">Page Not Found</h2>
          <p className="text-gray-600 text-lg">
            Oops! The page you're looking for doesn't exist.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 shadow-lg"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
          
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black border-2 border-black rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </motion.div>

        {/* Additional Help */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 text-sm text-gray-500"
        >
          <p>If this problem persists, please contact support.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Error404; 