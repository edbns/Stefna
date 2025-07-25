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
    <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-8 py-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full shadow-lg ${isOnline ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-red-400 shadow-red-400/50'} animate-pulse`}></div>
            <span className={`font-medium ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
              {isOnline ? 'SECURE CONNECTION' : 'CONNECTION LOST'}
            </span>
          </div>
          <div className="text-slate-500">•</div>
          <div className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full">
            <span className="text-orange-400 font-mono text-sm">CLASSIFIED OPERATION</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="text-right">
            <div className="text-white font-mono text-lg">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-slate-400 text-sm">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
              <span className="text-white text-sm">⚠️</span>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
              <span className="text-white text-sm">📡</span>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
              <span className="text-white text-sm">⚙️</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}