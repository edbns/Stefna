import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from './FollowButton';
import { Hash, Tag, Plus, TrendingUp, Users } from 'lucide-react';

interface FollowingManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface FollowingData {
  hashtags: string[];
  categories: string[];
}

const FollowingManager: React.FC<FollowingManagerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState<FollowingData>({ hashtags: [], categories: [] });
  const [activeTab, setActiveTab] = useState<'hashtags' | 'categories'>('hashtags');

  useEffect(() => {
    if (user) {
      loadFollowing();
    }
  }, [user]);

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

  // If it's being used as a modal (legacy), render the modal version
  if (isOpen !== undefined && onClose) {
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
          style={{ fontFamily: 'Figtree, sans-serif' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Following</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            {(['hashtags', 'categories'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({following[tab].length})
              </button>
            ))}
          </div>
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
                          <h4 className="font-medium text-black">
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
  }

  // Inline dashboard version
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" style={{ fontFamily: 'Figtree, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-gray-800 to-black rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-black">Following Dashboard</h2>
            <p className="text-sm text-gray-500">Manage your followed hashtags and categories</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-black">{following.hashtags.length + following.categories.length}</div>
            <div className="text-xs text-gray-500">Total Following</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Hash className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-blue-700">Hashtags</div>
                <div className="text-2xl font-bold text-blue-900">{following.hashtags.length}</div>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-purple-700">Categories</div>
                <div className="text-2xl font-bold text-purple-900">{following.categories.length}</div>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {(['hashtags', 'categories'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === tab
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {tab === 'hashtags' ? <Hash className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {following[tab].length}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {following[activeTab].length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  {activeTab === 'hashtags' ? (
                    <Hash className="w-10 h-10 text-gray-400" />
                  ) : (
                    <Tag className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No {activeTab} followed yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Start following {activeTab} from trending sections to see them here
                </p>
                <button className="inline-flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Explore {activeTab}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {following[activeTab].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-800 to-black flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {activeTab === 'hashtags' ? '#' : item.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-black">
                            {activeTab === 'hashtags' ? `#${item}` : item}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {activeTab === 'hashtags' ? 'Trending hashtag' : 'Content category'}
                          </p>
                        </div>
                      </div>
                      <FollowButton
                        type={activeTab === 'hashtags' ? 'hashtag' : 'category'}
                        item={item}
                        size="sm"
                        variant="secondary"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FollowingManager;