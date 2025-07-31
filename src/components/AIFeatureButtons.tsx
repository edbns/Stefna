import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  MessageSquare, 
  Twitter, 
  Hash, 
  TrendingUp, 
  FileText, 
  Copy, 
  Check,
  AlertCircle,
  Loader
} from 'lucide-react';
import AIFeatureService, { AIFeatureRequest, AIFeatureResponse, QuotaInfo } from '../services/AIFeatureService';
import toast from 'react-hot-toast';

interface AIFeatureButtonsProps {
  content: string;
  platform?: string;
  className?: string;
  onAuthOpen?: () => void;
}

interface AIFeature {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  type: AIFeatureRequest['type'];
  platform?: string;
  style?: string;
}

const AIFeatureButtons: React.FC<AIFeatureButtonsProps> = ({ 
  content, 
  platform = 'general',
  className = '',
  onAuthOpen
}) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const aiService = AIFeatureService.getInstance();

  // AI Features available
  const aiFeatures: AIFeature[] = [
    {
      id: 'caption',
      label: 'Generate Caption',
      icon: Sparkles,
      type: 'caption',
      platform: 'instagram'
    },
    {
      id: 'tweet',
      label: 'Generate Tweet',
      icon: Twitter,
      type: 'tweet',
      style: 'viral'
    },
    {
      id: 'reddit',
      label: 'Write Reddit Post',
      icon: MessageSquare,
      type: 'reddit',
      platform: 'general'
    },
    {
      id: 'title',
      label: 'Suggest Title',
      icon: FileText,
      type: 'title',
      platform: 'youtube'
    },
    {
      id: 'sentiment',
      label: 'Analyze Sentiment',
      icon: TrendingUp,
      type: 'sentiment'
    },
    {
      id: 'hashtags',
      label: 'Get Hashtags',
      icon: Hash,
      type: 'hashtags',
      platform: 'instagram'
    }
  ];

  const handleAIFeature = async (feature: AIFeature) => {
    // Check quota first
    const quota = aiService.getQuotaInfo();
    setQuotaInfo(quota);

    if (!quota.canUseFeature) {
      toast.error('Daily AI quota exceeded. Come back tomorrow or invite friends for more!');
      return;
    }

    setIsLoading(feature.id);

    try {
      const request: AIFeatureRequest = {
        type: feature.type,
        content: content,
        platform: feature.platform || platform,
        style: feature.style
      };

      const response: AIFeatureResponse = await aiService.executeFeature(request);

      if (response.success && response.result) {
        // Copy to clipboard
        await navigator.clipboard.writeText(response.result);
        
        toast.success(`${feature.label} generated and copied to clipboard!`);
        
        // Update quota info
        setQuotaInfo({
          ...quota,
          dailyUsed: quota.dailyUsed + 1,
          canUseFeature: (quota.dailyUsed + 1) < quota.dailyLimit
        });
      } else {
        toast.error(response.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('AI Feature Error:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Quota Display */}
      {quotaInfo && (
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>AI Uses: {quotaInfo.dailyUsed}/{quotaInfo.dailyLimit}</span>
          {!quotaInfo.canUseFeature && (
            <span className="text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Quota exceeded
            </span>
          )}
        </div>
      )}
      {/* AI Feature Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {aiFeatures.map((feature) => {
          const IconComponent = feature.icon;
          const isDisabled = !quotaInfo?.canUseFeature || isLoading === feature.id;
          
          return (
            <motion.button
              key={feature.id}
              onClick={() => handleAIFeature(feature)}
              disabled={isDisabled}
              className={`
                flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isDisabled 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800 hover:scale-105'
                }
              `}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
            >
              {isLoading === feature.id ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <IconComponent className="w-4 h-4" />
              )}
              <span className="truncate">{feature.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Quick Copy Content */}
      <motion.button
        onClick={() => copyToClipboard(content)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Copy className="w-4 h-4" />
        Copy Content
      </motion.button>
    </div>
  );
};

export default AIFeatureButtons; 