import React from 'react';

const menuItems = [
  { id: 'dashboard', label: 'Command Center', icon: '🏠' },
  { id: 'missions', label: 'Active Missions', icon: '🚀' },
  { id: 'intelligence', label: 'Intelligence', icon: '💡' },
  { id: 'surveillance', label: 'Surveillance', icon: '📱' },
  { id: 'agents', label: 'Field Agents', icon: '👥' },
  { id: 'analytics', label: 'Analytics', icon: '📈' }
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div className="w-72 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700/50 flex flex-col shadow-2xl">
      <div className="p-8 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">S</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SpyDash
            </h1>
            <p className="text-slate-400 text-sm">Intelligence Hub</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-6">
        <ul className="space-y-3">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-300 group ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-600/50 border border-transparent'
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && (
                  <div className="ml-auto w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-6 border-t border-slate-700/50">
        <div className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold">A</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">Agent Alpha</p>
            <p className="text-slate-400 text-sm">Level 9 Clearance</p>
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-xs">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}