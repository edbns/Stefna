import React from 'react';

const menuItems = [
  { id: 'dashboard', label: 'Command Center', icon: '🎯' },
  { id: 'missions', label: 'Active Missions', icon: '⚡' },
  { id: 'intelligence', label: 'Intelligence', icon: '🧠' },
  { id: 'surveillance', label: 'Surveillance', icon: '👁️' },
  { id: 'agents', label: 'Field Agents', icon: '🕴️' },
  { id: 'analytics', label: 'Analytics', icon: '📊' }
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-red-400">SpyDash</h1>
        <p className="text-gray-400 text-sm mt-1">Intelligence Hub</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <p className="text-white font-medium">Agent Alpha</p>
            <p className="text-gray-400 text-sm">Level 9 Clearance</p>
          </div>
        </div>
      </div>
    </div>
  );
}