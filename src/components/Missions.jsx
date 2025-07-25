import React, { useState } from 'react';

export default function Missions() {
  const [missions] = useState([
    {
      id: 'OP-001',
      name: 'Operation Nightfall',
      status: 'active',
      priority: 'high',
      agent: 'Agent Alpha',
      location: 'Moscow, Russia',
      progress: 75,
      startDate: '2024-01-15',
      objective: 'Gather intelligence on emerging threats in the region',
      lastUpdate: '2 hours ago'
    },
    {
      id: 'OP-002',
      name: 'Project Blackout',
      status: 'planning',
      priority: 'critical',
      agent: 'Agent Bravo',
      location: 'Berlin, Germany',
      progress: 25,
      startDate: '2024-01-20',
      objective: 'Surveillance and intelligence gathering on suspicious activities',
      lastUpdate: '6 hours ago'
    },
    {
      id: 'OP-003',
      name: 'Shadow Protocol',
      status: 'completed',
      priority: 'medium',
      agent: 'Agent Charlie',
      location: 'Tokyo, Japan',
      progress: 100,
      startDate: '2024-01-10',
      objective: 'Cyber security assessment of regional networks',
      lastUpdate: '1 day ago'
    },
    {
      id: 'OP-004',
      name: 'Silent Storm',
      status: 'on-hold',
      priority: 'low',
      agent: 'Agent Delta',
      location: 'Paris, France',
      progress: 50,
      startDate: '2024-01-12',
      objective: 'Asset recruitment and network establishment',
      lastUpdate: '3 days ago'
    }
  ]);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'planning': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'on-hold': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getPriorityStyle = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-emerald-500 to-green-500';
    if (progress >= 60) return 'from-blue-500 to-cyan-500';
    if (progress >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-purple-500 to-pink-500';
  };

  const MissionCard = ({ mission }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{mission.name}</h3>
          <p className="text-slate-400 text-sm font-mono bg-slate-900/50 px-2 py-1 rounded-lg inline-block">
            {mission.id}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityStyle(mission.priority)}`}>
            {mission.priority.toUpperCase()}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(mission.status)}`}>
            {mission.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600/30">
          <p className="text-slate-300 text-sm leading-relaxed">{mission.objective}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">👤</span>
            <div>
              <span className="text-slate-400 block">Agent</span>
              <span className="text-white font-medium">{mission.agent}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📍</span>
            <div>
              <span className="text-slate-400 block">Location</span>
              <span className="text-white font-medium">{mission.location}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📅</span>
            <div>
              <span className="text-slate-400 block">Start Date</span>
              <span className="text-white font-medium">{mission.startDate}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🕒</span>
            <div>
              <span className="text-slate-400 block">Last Update</span>
              <span className="text-white font-medium">{mission.lastUpdate}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-sm font-medium">Mission Progress</span>
            <span className="text-white font-bold text-lg">{mission.progress}%</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className={`bg-gradient-to-r ${getProgressColor(mission.progress)} h-3 rounded-full transition-all duration-500 shadow-lg`}
              style={{width: `${mission.progress}%`}}
            ></div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg">
            View Details
          </button>
          <button className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Mission Control</h1>
          <p className="text-slate-400 text-lg">Manage and monitor all active operations</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg">
          + New Mission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl">🚀</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400 mb-1">12</div>
          <div className="text-slate-400 text-sm">Active Operations</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl">📋</span>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">5</div>
          <div className="text-slate-400 text-sm">In Planning</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl">✅</span>
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-1">23</div>
          <div className="text-slate-400 text-sm">Completed</div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg">
        <div className="flex flex-wrap gap-4 mb-6">
          <select className="bg-slate-700/50 text-white px-4 py-3 rounded-xl border border-slate-600/50 focus:border-blue-500/50 transition-colors">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Planning</option>
            <option>Completed</option>
            <option>On Hold</option>
          </select>
          <select className="bg-slate-700/50 text-white px-4 py-3 rounded-xl border border-slate-600/50 focus:border-blue-500/50 transition-colors">
            <option>All Priorities</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <input 
            type="text" 
            placeholder="Search missions..." 
            className="bg-slate-700/50 text-white px-4 py-3 rounded-xl border border-slate-600/50 focus:border-blue-500/50 transition-colors flex-1 min-w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </div>
    </div>
  );
}