import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from './FollowButton';

interface FollowingManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FollowingData {
  hashtags: string[];
  categories: string[];
}

const FollowingManager: React.FC<FollowingManagerProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const [following, setFollowing] = useState<FollowingData>({ hashtags: [], categories: [] });
  const [activeTab, setActiveTab] = useState<'hashtags' | 'categories'>('hashtags');

  useEffect(() => {
    if (isAuthenticated) {
      loadFollowing();
    }
  }, [isAuthenticated, isOpen]);

  useEffect(() => {
    const handleFollowingUpdate = () => {
      loadFollowing();
    };

    window.addEventListener('followingUpdated', handleFollowingUpdate);
    return () => window.removeEventListener('followingUpdated', handleFollowingUpdate);
  }, []);

  const loadFollowing = () => {
    const hashtags = JSON.parse(localStorage.getItem('following_hashtags') || '[]');
    const categories = JSON.parse(localStorage.getItem('following_categories') || '[]');
    setFollowing({ hashtags, categories });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden"
        style={{ backgroundColor: '#eee9dd', fontFamily: 'Figtree, sans-serif' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#2a4152' }}>
            Following
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          {(['hashtags', 'categories'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === tab
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={{
                backgroundColor: activeTab === tab ? '#2a4152' : 'transparent'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({following[tab].length})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-96">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {following[activeTab].length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No {activeTab} followed yet
                  </h3>
                  <p className="text-gray-500">
                    Start following {activeTab} to see them here
                  </p>
                </div>
              ) : (
                following[activeTab].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {activeTab === 'hashtags' ? '#' : item.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium" style={{ color: '#2a4152' }}>
                          {activeTab === 'hashtags' ? `#${item}` : item}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {activeTab === 'hashtags' ? 'Hashtag' : 'Category'}
                        </p>
                      </div>
                    </div>
                    <FollowButton
                      type={activeTab === 'hashtags' ? 'hashtag' : 'category'}
                      item={item}
                      size="sm"
                      variant="secondary"
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FollowingManager;