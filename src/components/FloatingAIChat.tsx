import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIResponse, getProviderStatus } from '../services/AIService';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

interface FloatingAIChatProps {
  onClose?: () => void;
}

const FloatingAIChat: React.FC<FloatingAIChatProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; provider?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldBounce, setShouldBounce] = useState(false);
  const [arrowAnimation, setArrowAnimation] = useState(false);
  const [providerStatus, setProviderStatus] = useState<Record<string, { available: boolean; lastSuccess?: number }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Auto-scroll to bottom when messages change with improved timing
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }, 100);
  };

  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  // Enhanced bounce animation with arrow animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        setShouldBounce(true);
        setArrowAnimation(true);
        setTimeout(() => {
          setShouldBounce(false);
          setArrowAnimation(false);
        }, 1000);
      }
    }, 8000); // Increased interval

    return () => clearInterval(interval);
  }, [isOpen]);

  // Check provider status periodically
  useEffect(() => {
    const updateProviderStatus = () => {
      setProviderStatus(getProviderStatus());
    };

    updateProviderStatus();
    const interval = setInterval(updateProviderStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const aiResponse = await getAIResponse(userMessage);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: aiResponse.content,
        provider: aiResponse.provider
      }]);
      
      toast.success(`Response from ${aiResponse.provider}`, {
        duration: 2000,
        position: 'bottom-right'
      });
    } catch (error) {
      console.error('AI response error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble connecting to my AI services right now. Please try again in a moment.',
        provider: 'error'
      }]);
      
      toast.error('AI service temporarily unavailable', {
        duration: 4000,
        position: 'bottom-right'
      });
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

  const getProviderIndicator = (provider?: string) => {
    if (!provider || provider === 'error') return null;
    
    const status = providerStatus[provider];
    const isAvailable = status?.available ?? true;
    
    return (
      <div className={`flex items-center gap-1 text-xs mt-1 ${
        isAvailable ? 'text-green-600' : 'text-red-600'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          isAvailable ? 'bg-green-500' : 'bg-red-500'
        }`} />
        {provider}
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-black text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 flex items-center justify-center group ${
          shouldBounce ? 'animate-bounce' : ''
        }`}
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="relative">
          <MessageCircle className="w-7 h-7 text-white group-hover:text-gray-200 transition-colors" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        
        {arrowAnimation && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="absolute -top-12 right-0 bg-black text-white px-3 py-2 rounded-xl text-xs shadow-2xl border border-gray-800"
          >
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Ask Stefna AI
            </div>
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </motion.div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-black to-gray-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Stefna AI</h3>
                  <p className="text-xs text-gray-300">Your trending assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-gray-500 py-12"
                >
                  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-700 mb-2">Welcome to Stefna AI!</h4>
                  <p className="text-sm text-gray-500">Ask me about trending content, social media insights, or anything else!</p>
                </motion.div>
              )}
              
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-white text-black border border-gray-200'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.role === 'assistant' && getProviderIndicator(msg.provider)}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Stefna AI anything..."
                  className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-gray-50 text-black placeholder-gray-500 transition-all duration-200"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl group"
                >
                  <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAIChat;