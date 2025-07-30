import React from 'react';
import { Heart, UserPlus, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  type: 'like' | 'follow' | 'general';
  title?: string;
  description?: string;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({
  isOpen,
  onClose,
  onSignIn,
  type,
  title,
  description
}) => {
  const getContent = () => {
    switch (type) {
      case 'like':
        return {
          icon: <Heart className="w-8 h-8 text-pink-500" />,
          gradient: 'from-pink-400 to-red-500',
          title: title || 'Want to like this?',
          description: description || 'Sign in to save your favorites and build your collection!',
          buttonText: 'Sign In to Like',
          buttonGradient: 'from-pink-500 to-red-500'
        };
      case 'follow':
        return {
          icon: <UserPlus className="w-8 h-8 text-blue-500" />,
          gradient: 'from-blue-400 to-purple-500',
          title: title || 'Want to follow this?',
          description: description || 'Sign in to stay updated with the latest trends!',
          buttonText: 'Sign In to Follow',
          buttonGradient: 'from-blue-500 to-purple-500'
        };
      default:
        return {
          icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
          gradient: 'from-yellow-400 to-orange-500',
          title: title || 'Join the community!',
          description: description || 'Sign in to unlock all features and personalize your experience!',
          buttonText: 'Sign In',
          buttonGradient: 'from-yellow-500 to-orange-500'
        };
    }
  };

  const content = getContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", damping: 15 }}
                className={`w-16 h-16 bg-gradient-to-r ${content.gradient} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {content.icon}
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-gray-900 mb-3"
              >
                {content.title}
              </motion.h3>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 mb-8 leading-relaxed"
              >
                {content.description}
              </motion.p>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3 mb-8"
              >
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Save your favorites</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Get personalized recommendations</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Track your interactions</span>
                </div>
              </motion.div>

              {/* Sign In Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={onSignIn}
                className={`w-full bg-gradient-to-r ${content.buttonGradient} text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
              >
                {content.buttonText}
              </motion.button>

              {/* Skip Option */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Maybe later
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthPrompt; 