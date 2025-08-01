import React, { useState } from 'react';
import { Wand2, Download, Share2, Save, Sparkles, ArrowLeft } from 'lucide-react';
import { Photo, ProcessingJob } from '../../types';
import { aiService, presetFilters } from '../../services/ai';
import { imageUtils } from '../../utils/image';
import { useQuota } from '../../hooks/useQuota';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface EditScreenProps {
  currentPhoto?: Photo;
  onGoToCamera: () => void;
}

const EditScreen: React.FC<EditScreenProps> = ({ currentPhoto, onGoToCamera }) => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [processingJob, setProcessingJob] = useState<ProcessingJob | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const { canUseToken, useToken, getRemainingTokens } = useQuota();

  const handleApplyFilter = async () => {
    if (!currentPhoto || !canUseToken()) {
      toast.error('No credits remaining or no photo selected');
      return;
    }

    const filter = presetFilters.find(f => f.id === selectedFilter);
    const prompt = filter?.prompt || customPrompt;

    if (!prompt.trim()) {
      toast.error('Please select a filter or enter a custom prompt');
      return;
    }

    const success = useToken();
    if (!success) {
      toast.error('Unable to use credit');
      return;
    }

    try {
      const job = await aiService.processImage(currentPhoto.originalUrl, prompt);
      setProcessingJob(job);
      toast.success('AI processing started!');

      // Simulate processing completion for demo
      setTimeout(() => {
        // In a real app, you'd poll the job status
        const demoResult = currentPhoto.originalUrl; // Use original for demo
        setProcessedImage(demoResult);
        setProcessingJob(null);
        setShowBeforeAfter(true);
        toast.success('AI filter applied successfully!');
      }, 5000);

    } catch (error) {
      toast.error('Failed to process image');
      console.error(error);
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      imageUtils.downloadImage(processedImage, 'ai-filtered-photo.jpg');
      toast.success('Image saved!');
    }
  };

  const handleShare = async () => {
    if (processedImage) {
      const shared = await imageUtils.shareImage(processedImage);
      if (shared) {
        toast.success('Image shared!');
      } else {
        toast.success('Image downloaded!');
      }
    }
  };

  const savePromptRecipe = () => {
    if (!processedImage || !currentPhoto) return;
    
    const filter = presetFilters.find(f => f.id === selectedFilter);
    const prompt = filter?.prompt || customPrompt;
    
    // In a real app, this would save to your backend
    toast.success('Prompt recipe saved to your collection!');
  };

  if (!currentPhoto) {
    return (
      <div className="screen-container flex items-center justify-center text-center">
        <div>
          <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wand2 size={48} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Photo Selected</h2>
          <p className="text-gray-600 mb-6">
            Go to the Camera tab to capture or upload a photo first
          </p>
          <button
            onClick={onGoToCamera}
            className="button-primary"
          >
            Go to Camera
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Filters</h1>
        <div className="text-sm text-gray-600">
          {getRemainingTokens()} credits left
        </div>
      </div>

      {/* Photo display */}
      <div className="mb-6">
        {showBeforeAfter && processedImage ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Original</p>
                <img 
                  src={currentPhoto.originalUrl} 
                  alt="Original" 
                  className="w-full h-32 object-cover rounded-xl"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">AI Filtered</p>
                <img 
                  src={processedImage} 
                  alt="Processed" 
                  className="w-full h-32 object-cover rounded-xl"
                />
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>Save</span>
              </button>
              <button
                onClick={handleShare}
                className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
              <button
                onClick={savePromptRecipe}
                className="flex-1 bg-purple-500 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
              >
                <Save size={16} />
                <span>Recipe</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img 
              src={currentPhoto.originalUrl} 
              alt="Current photo" 
              className="w-full h-64 object-cover rounded-2xl"
            />
            {processingJob && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
                <div className="text-center text-white">
                  <Sparkles className="animate-spin mx-auto mb-2" size={32} />
                  <p className="font-medium">AI is working its magic...</p>
                  <p className="text-sm opacity-75">This may take a few seconds</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!showBeforeAfter && (
        <>
          {/* Preset filters */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Preset Filters</h3>
            <div className="grid grid-cols-2 gap-3">
              {presetFilters.map((filter) => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedFilter === filter.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{filter.isPopular ? '🔥' : '✨'}</span>
                    <span className="font-medium text-gray-900">{filter.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{filter.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Custom Prompt</h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe the style you want... (e.g., 'vintage photo, sepia tones, film grain')"
              className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          </div>

          {/* Apply button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApplyFilter}
            disabled={!canUseToken() || !!processingJob || (!selectedFilter && !customPrompt.trim())}
            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 ${
              canUseToken() && !processingJob && (selectedFilter || customPrompt.trim())
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Wand2 size={20} />
            <span>
              {!canUseToken() ? 'No Credits Left' : 
               processingJob ? 'Processing...' : 
               'Apply AI Filter (1 credit)'}
            </span>
          </motion.button>
        </>
      )}

      {showBeforeAfter && (
        <button
          onClick={() => {
            setShowBeforeAfter(false);
            setProcessedImage(null);
            setSelectedFilter(null);
            setCustomPrompt('');
          }}
          className="w-full button-secondary flex items-center justify-center space-x-2"
        >
          <ArrowLeft size={16} />
          <span>Apply Another Filter</span>
        </button>
      )}
    </div>
  );
};

export default EditScreen;