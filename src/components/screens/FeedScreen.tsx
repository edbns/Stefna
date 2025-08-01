import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, Wand2, TrendingUp, Clock } from 'lucide-react';
import { PromptRecipe } from '../../types';
import { storage } from '../../utils/storage';
import { initializeDemoData } from '../../utils/demoData';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface FeedScreenProps {
  onTryPrompt: (prompt: string) => void;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ onTryPrompt }) => {
  const [prompts, setPrompts] = useState<PromptRecipe[]>([]);
  const [favoritePrompts, setFavoritePrompts] = useState<string[]>([]);
  const [filter, setFilter] = useState<'trending' | 'recent'>('trending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeDemoData();
    loadPrompts();
    setFavoritePrompts(storage.getFavoritePrompts());
  }, []);

  const loadPrompts = () => {
    const feed = storage.getPromptFeed();
    setPrompts(feed);
    setLoading(false);
  };

  const toggleLike = (promptId: string) => {
    setPrompts(prev => prev.map(prompt => 
      prompt.id === promptId 
        ? { 
            ...prompt, 
            isLiked: !prompt.isLiked,
            likes: prompt.isLiked ? prompt.likes - 1 : prompt.likes + 1
          }
        : prompt
    ));
    toast.success('Thanks for the feedback!');
  };

  const toggleFavorite = (promptId: string) => {
    const isFavorited = favoritePrompts.includes(promptId);
    
    if (isFavorited) {
      storage.removeFavoritePrompt(promptId);
      setFavoritePrompts(prev => prev.filter(id => id !== promptId));
      toast.success('Removed from favorites');
    } else {
      storage.addFavoritePrompt(promptId);
      setFavoritePrompts(prev => [...prev, promptId]);
      toast.success('Added to favorites!');
    }

    setPrompts(prev => prev.map(prompt => 
      prompt.id === promptId 
        ? { ...prompt, isFavorited: !isFavorited }
        : prompt
    ));
  };

  const handleTryPrompt = (prompt: PromptRecipe) => {
    onTryPrompt(prompt.prompt);
    toast.success(`"${prompt.name}" prompt applied! Go to Edit tab to use it.`);
  };

  const sortedPrompts = [...prompts].sort((a, b) => {
    if (filter === 'trending') {
      return b.likes - a.likes;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  if (loading) {
    return (
      <div className="screen-container">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 h-64 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prompt Feed</h1>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('trending')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
              filter === 'trending'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <TrendingUp size={14} className="inline mr-1" />
            Trending
          </button>
          <button
            onClick={() => setFilter('recent')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
              filter === 'recent'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <Clock size={14} className="inline mr-1" />
            Recent
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedPrompts.map((prompt, index) => (
          <motion.div
            key={prompt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Image */}
            <div className="relative">
              <img 
                src={prompt.imageUrl} 
                alt={prompt.name}
                className="w-full h-48 object-cover"
              />
              
              {/* Overlay info */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                <div className="bg-black bg-opacity-50 rounded-lg px-2 py-1">
                  <span className="text-white text-xs font-medium">
                    {prompt.authorName || 'Anonymous'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {prompt.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="bg-purple-500 bg-opacity-90 text-white text-xs px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    {prompt.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {prompt.description}
                  </p>
                </div>
              </div>

              {/* Prompt text */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 font-mono leading-relaxed">
                  "{prompt.prompt}"
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleLike(prompt.id)}
                    className={`flex items-center space-x-1 transition-colors ${
                      prompt.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart 
                      size={20} 
                      className={prompt.isLiked ? 'fill-current' : ''} 
                    />
                    <span className="text-sm font-medium">{prompt.likes}</span>
                  </button>

                  <button
                    onClick={() => toggleFavorite(prompt.id)}
                    className={`transition-colors ${
                      favoritePrompts.includes(prompt.id) 
                        ? 'text-yellow-500' 
                        : 'text-gray-500 hover:text-yellow-500'
                    }`}
                  >
                    <Bookmark 
                      size={20} 
                      className={favoritePrompts.includes(prompt.id) ? 'fill-current' : ''} 
                    />
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTryPrompt(prompt)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-md"
                >
                  <Wand2 size={16} />
                  <span>Try This</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Community tips */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2">✨ Community Tips</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Try prompts that match your photo's mood and subject</li>
          <li>• Like prompts to help others discover great styles</li>
          <li>• Save favorites for quick access later</li>
          <li>• Share your own creations to inspire the community</li>
        </ul>
      </div>
    </div>
  );
};

export default FeedScreen;