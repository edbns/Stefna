import React, { useState, useEffect } from 'react';

export default function Header({ isOnline }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-gray-300">
              {isOnline ? 'SECURE CONNECTION' : 'CONNECTION LOST'}
            </span>
          </div>
          <div className="text-gray-400">|</div>
          <div className="text-red-400 font-mono">
            CLASSIFIED OPERATION
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-white font-mono">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-gray-400 text-sm">
              {currentTime.toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-black text-sm">⚠️</span>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">📡</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}