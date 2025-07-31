import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  Loader,
  Youtube,
  BarChart3,
  Zap,
  Globe,
  Users
} from 'lucide-react';
import AIFeatureService from '../services/AIFeatureService';
import toast from 'react-hot-toast';

interface AITool {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  placeholder: string;
  inputLabel: string;
  type: 'text' | 'url' | 'content';
  feature: string;
}

interface AIToolsDashboardProps {
  toolId?: string;
}

const AIToolsDashboard: React.FC<AIToolsDashboardProps> = ({ toolId }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const aiService = AIFeatureService.getInstance();

  const aiTools: AITool[] = [
    {
      id: 'youtube-summarizer',
      label: 'YouTube Summarizer',
      description: 'Get AI-powered summaries of any YouTube video',
      icon: Youtube,
      placeholder: 'Paste a YouTube link to get a summary...',
      inputLabel: 'YouTube URL',
      type: 'url',
      feature: 'summarize'
    },
    {
      id: 'content-generator',
      label: 'Content Generator',
      description: 'Create viral content from any topic or idea',
      icon: Sparkles,
      placeholder: 'Describe your idea or topic to generate content...',
      inputLabel: 'Your Content Idea',
      type: 'text',
      feature: 'content'
    },
    {
      id: 'caption-writer',
      label: 'Caption Writer',
      description: 'Generate engaging social media captions',
      icon: MessageSquare,
      placeholder: 'Describe your post for a catchy caption...',
      inputLabel: 'Your Post Description',
      type: 'text',
      feature: 'caption'
    },
    {
      id: 'tweet-creator',
      label: 'X Creator',
      description: 'Create viral posts that get engagement',
      icon: Twitter,
      placeholder: 'What do you want to post about?',
      inputLabel: 'Post Topic',
      type: 'text',
      feature: 'tweet'
    },
    {
      id: 'sentiment-analyzer',
      label: 'Sentiment Analyzer',
      description: 'Analyze content sentiment and viral potential',
      icon: BarChart3,
      placeholder: 'Paste text to analyze its sentiment...',
      inputLabel: 'Content to Analyze',
      type: 'text',
      feature: 'sentiment'
    },
    {
      id: 'hashtag-generator',
      label: 'Hashtag Generator',
      description: 'Generate trending hashtags for any content',
      icon: Hash,
      placeholder: 'Describe your content to get hashtags...',
      inputLabel: 'Your Content',
      type: 'text',
      feature: 'hashtags'
    }
  ];

  // If no toolId is provided, show the tool selection interface
  const showToolSelection = !toolId;
  const activeTool = toolId ? aiTools.find(t => t.id === toolId) : null;

  const handleToolSelect = (selectedToolId: string) => {
    // This would be handled by the parent component through navigation
    console.log('Tool selected:', selectedToolId);
  };

  const handleGenerate = async () => {
    if (!activeTool || !inputText.trim()) return;

    setIsLoading(true);
    setResult('');

    try {
      const quota = aiService.getQuotaInfo();
      if (!quota.canUseFeature) {
        toast.error('Daily AI quota exceeded. Come back tomorrow or invite friends for more!');
        return;
      }

      let response;
      switch (activeTool.feature) {
        case 'caption':
          response = await aiService.generateCaption(inputText, 'instagram');
          break;
        case 'tweet':
          response = await aiService.generateTweet(inputText, 'viral');
          break;
        case 'hashtags':
          response = await aiService.generateHashtags(inputText, 'instagram');
          break;
        case 'sentiment':
          response = await aiService.analyzeSentiment(inputText);
          break;
        case 'content':
          response = await aiService.executeFeature({
            type: 'caption',
            content: inputText,
            platform: 'instagram'
          });
          break;
        case 'summarize':
          response = await aiService.executeFeature({
            type: 'title',
            content: inputText,
            platform: 'youtube'
          });
          break;
        default:
          response = await aiService.generateCaption(inputText, 'instagram');
      }

      if (response.success && response.result) {
        setResult(response.result);
        toast.success(`${activeTool.label} generated successfully!`);
      } else {
        toast.error(response.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('AI Tool Error:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsLoading(false);
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

  // If showing tool selection (no specific tool selected)
  if (showToolSelection) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 bg-white">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">AI Tools</h1>
              <p className="text-gray-600">Create viral content with AI assistance</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tools Selection */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-black mb-4">Choose a Tool</h2>
            <div className="space-y-3">
              {aiTools.map((tool) => {
                const IconComponent = tool.icon;
                
                return (
                  <motion.button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-black"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <IconComponent className="w-6 h-6 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{tool.label}</div>
                      <div className="text-xs text-gray-500">
                        {tool.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Placeholder */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Select a Tool</h3>
                <p className="text-gray-500">Choose an AI tool from the left to get started</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If a specific tool is selected, show only that tool's interface
  if (!activeTool) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-2">Tool Not Found</h1>
          <p className="text-gray-600">The selected AI tool could not be found.</p>
        </div>
      </div>
    );
  }

  const IconComponent = activeTool.icon;

  return (
    <div className="p-6 sm:p-8 lg:p-10 bg-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">{activeTool.label}</h1>
            <p className="text-gray-600">{activeTool.description}</p>
          </div>
        </div>
      </div>

      {/* Tool Interface */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Input Section */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-3">{activeTool.inputLabel}</h3>
            <div className="space-y-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={activeTool.placeholder}
                className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                disabled={isLoading}
              />
              <button
                onClick={handleGenerate}
                disabled={!inputText.trim() || isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Result</h3>
                <button
                  onClick={() => copyToClipboard(result)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {result}
                </pre>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIToolsDashboard; 