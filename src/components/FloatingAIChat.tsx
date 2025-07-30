import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, Zap, Brain, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FloatingAIChatProps {
  onClose?: () => void;
}

const FloatingAIChat: React.FC<FloatingAIChatProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldBounce, setShouldBounce] = useState(false);
  const [arrowAnimation, setArrowAnimation] = useState(false);
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
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Temporarily disabled due to OpenRouter billing issues
    const aiResponse = 'AI chat is temporarily disabled due to billing issues. Please add credits to your OpenRouter account to enable this feature.';
    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Square Button at Bottom Right with Gradient Black */}
      {!isOpen && (
        <div className="fixed bottom-6 right-0 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className={`relative w-16 h-20 bg-gradient-to-l from-black to-transparent text-white transition-all duration-500 flex items-center justify-start pl-2 group hover:w-20 ${
              shouldBounce ? 'animate-pulse' : ''
            }`}
            style={{
              background: 'linear-gradient(270deg, #000000 0%, #000000 70%, transparent 100%)',
              borderTopLeftRadius: '12px',
              borderBottomLeftRadius: '12px',
              boxShadow: '-5px 0 20px rgba(0, 0, 0, 0.3)'
            }}
            title="Open AI Assistant"
          >
            {/* Animated Arrow */}
            <div className="relative flex items-center">
              <ChevronLeft 
                className={`w-6 h-6 transition-all duration-500 group-hover:scale-125 ${
                  arrowAnimation ? 'animate-bounce translate-x-1' : ''
                }`}
              />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-gray-300 animate-pulse opacity-80" />
            </div>
            
            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-gray-800 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-l-xl"></div>
            
            {/* Pulsing Indicator */}
            <div className="absolute top-2 left-2 w-2 h-2 bg-gray-400 rounded-full animate-ping"></div>
          </button>
        </div>
      )}

      {/* Enhanced Chat Modal with Right-to-Left Slide Animation */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-500"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Container with Right-to-Left Slide Animation */}
          <div className={`fixed bottom-6 right-0 w-96 h-[32rem] bg-white rounded-l-2xl shadow-2xl border-l border-t border-b border-gray-800 z-50 flex flex-col overflow-hidden transition-all duration-700 ease-out ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
            boxShadow: '-25px 0 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Enhanced Header with Black Gradient */}
            <div className="bg-gradient-to-r from-black to-gray-900 text-white p-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/20 to-black/20 animate-pulse"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  <Brain className="w-6 h-6 animate-pulse text-white" />
                  <div className="absolute inset-0 bg-gray-600 rounded-full opacity-20 animate-ping"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg font-['Figtree'] flex items-center gap-2 text-white">
                    AI Assistant
                    <Zap className="w-4 h-4 text-white animate-bounce" />
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-300 transition-all duration-300 hover:rotate-90 hover:scale-110 relative z-10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Enhanced Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-900 to-black">
              {messages.length === 0 && (
                <div className="text-center text-white text-sm font-['Figtree'] bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-white animate-spin" />
                    <span className="font-semibold text-white">Welcome to AI Assistant!</span>
                  </div>
                  <p className="text-white">Ask me anything about social media trends, content analysis, or platform insights!</p>
                </div>
              )}
              
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  style={{
                    animation: `slideInFromRight 0.5s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-sm font-['Figtree'] shadow-lg transition-all duration-300 hover:shadow-xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-gray-700 to-black text-white'
                        : 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200 border border-gray-700'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200 p-4 rounded-2xl text-sm font-['Figtree'] border border-gray-700 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-gray-400 animate-pulse" />
                      <span>AI is thinking...</span>
                      <div className="flex items-center gap-1 ml-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Input Area */}
            <div className="p-5 border-t border-gray-700 bg-gradient-to-r from-gray-900 to-black">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm font-['Figtree'] transition-all duration-300 hover:border-gray-500 bg-gray-800 text-gray-200 placeholder-gray-400"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-gray-700 to-black text-white rounded-xl hover:from-gray-600 hover:to-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Custom Animations */}
      <style>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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
        
        /* Custom tooltip styling */
        [title]:hover::after {
          content: attr(title);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
          color: #e5e5e5;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
        }
      `}</style>
    </>
  );
};

export default FloatingAIChat;