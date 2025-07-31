import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles,
  TrendingUp,
  Hash,
  FileText,
  Loader,
  MessageCircle,
  Zap,
  Heart,
  Star,
  Globe,
  Music,
  Video,
  Image
} from 'lucide-react';
import AIFeatureService from '../services/AIFeatureService';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface StefnaAIChatProps {
  onAuthOpen?: () => void;
}

// Custom Logo Component
const CustomLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Black square with rounded corners and white horizontal line */}
      <rect x="2" y="2" width="20" height="20" rx="4" fill="black"/>
      <rect x="6" y="11" width="12" height="2" rx="1" fill="white"/>
    </svg>
  );
};

const StefnaAIChat: React.FC<StefnaAIChatProps> = ({ onAuthOpen }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey there! I'm Stefna AI, your creative companion.\n\nI can help you with:\n• Generate viral content and captions\n• Create trending hashtags\n• Analyze what's hot right now\n• Design engaging posts\n• Suggest music and trends\n\nWhat would you like to explore today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiService = AIFeatureService.getInstance();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, isUser: boolean = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    addMessage(userMessage, true);
    setIsLoading(true);

    try {
      // Check quota
      const quota = aiService.getQuotaInfo();
      if (!quota.canUseFeature) {
        addMessage("I've reached my daily limit! Come back tomorrow or invite friends for more AI features.");
        setIsLoading(false);
        return;
      }

      // Generate AI response based on user input
      let response = '';
      
      if (userMessage.toLowerCase().includes('caption') || userMessage.toLowerCase().includes('post')) {
        const aiResponse = await aiService.generateCaption(userMessage, 'instagram');
        response = aiResponse.success ? aiResponse.result! : "Sorry, I couldn't generate a caption right now. Try again later!";
      } else if (userMessage.toLowerCase().includes('tweet') || userMessage.toLowerCase().includes('twitter')) {
        const aiResponse = await aiService.generateTweet(userMessage, 'viral');
        response = aiResponse.success ? aiResponse.result! : "Sorry, I couldn't generate a tweet right now. Try again later!";
      } else if (userMessage.toLowerCase().includes('hashtag')) {
        const aiResponse = await aiService.generateHashtags(userMessage, 'instagram');
        response = aiResponse.success ? aiResponse.result! : "Sorry, I couldn't generate hashtags right now. Try again later!";
      } else if (userMessage.toLowerCase().includes('trend') || userMessage.toLowerCase().includes('viral')) {
        const aiResponse = await aiService.analyzeSentiment(userMessage);
        response = aiResponse.success ? aiResponse.result! : "Sorry, I couldn't analyze trends right now. Try again later!";
      } else {
        // General conversation - more engaging responses
        const responses = [
          "That's interesting! I love helping creators like you. What kind of content are you working on?",
          "Great question! I'm here to help you create amazing content. Want to explore some trending topics?",
          "I'm excited to help! Let's make your content go viral. What platform are you focusing on?",
          "That sounds fun! I can help with captions, hashtags, trends, and more. What's your next project?",
          "Love the energy! I'm your AI creative partner. Ready to create something amazing together?"
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
      }

      addMessage(response, false);
    } catch (error) {
      console.error('Stefna AI Error:', error);
      addMessage("Sorry, I'm having trouble right now. Please try again later!", false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { text: "Generate viral caption", icon: Sparkles },
    { text: "Create trending hashtags", icon: Hash },
    { text: "What's trending now?", icon: TrendingUp },
    { text: "Analyze my content", icon: FileText },
    { text: "Tell me a joke", icon: Heart },
    { text: "Generate content ideas", icon: Zap }
  ];

  const handleQuickAction = (action: string) => {
    setInputText(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
            <CustomLogo className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Stefna AI</h1>
            <p className="text-gray-600">Your Creative AI Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
            <Sparkles className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">AI Powered</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-6 py-4 rounded-2xl ${
                  message.isUser
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-black border border-gray-200'
                }`}
              >
                <p className="text-base whitespace-pre-wrap leading-relaxed">{message.text}</p>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 text-black px-6 py-4 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <Loader className="w-5 h-5 animate-spin text-gray-600" />
                  <span className="text-base text-gray-600">Stefna is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.text)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-black rounded-xl text-sm font-medium hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{action.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-4">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Chat with Stefna AI... What's on your mind?"
              className="flex-1 px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent text-base"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="px-6 py-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="font-medium">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StefnaAIChat; 