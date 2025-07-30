import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Minimize2, Maximize2, Sparkles, Zap, Brain } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hi! I\'m your AI assistant. I can help you analyze trending content, suggest optimization strategies, and answer questions about social media trends. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Temporarily disabled due to OpenRouter billing issues
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: 'AI chat is temporarily disabled due to billing issues. Please add credits to your OpenRouter account to enable this feature.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiResponse]);
    setIsLoading(false);
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-500"
        onClick={onClose}
      />
      
      {/* Enhanced Chat Container with Slide Animation */}
      <div className={`fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-700 ease-out transform ${
        isAnimating ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      } ${
        isMinimized ? 'w-80 h-20' : 'w-[28rem] h-[42rem]'
      }`}
      style={{
        background: isMinimized ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 animate-pulse"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Brain className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-white rounded-full opacity-20 animate-ping"></div>
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-spin" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl font-['Figtree'] flex items-center gap-2">
                AI Assistant
                <Zap className="w-5 h-5 text-yellow-300 animate-bounce" />
              </h3>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Online & Ready
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-white/70 hover:text-white transition-all duration-300 hover:scale-110 hover:rotate-12"
            >
              {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white transition-all duration-300 hover:scale-110 hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Enhanced Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 h-[32rem] bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex gap-4 animate-slideIn ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {message.type === 'ai' && (
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap font-['Figtree']">{message.content}</p>
                    <p className={`text-xs mt-2 opacity-70 flex items-center gap-1`}>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start animate-fadeIn">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Brain className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-lg">
                    <div className="flex items-center gap-2 text-sm font-['Figtree'] text-gray-600 dark:text-gray-300">
                      <span>AI is thinking</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Input Area */}
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-3xl">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about trends, analytics, or optimization..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-['Figtree'] transition-all duration-300 hover:border-purple-300"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Custom Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.6s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </>
  );
};

export default AIChat;