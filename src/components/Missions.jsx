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
      objective: 'Infiltrate and extract classified documents from enemy facility',
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
      objective: 'Surveillance and intelligence gathering on terrorist cell',
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
      objective: 'Cyber infiltration of foreign intelligence network',
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'planning': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'on-hold': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'text-red-400 border-red-400';
      case 'high': return 'text-orange-400 border-orange-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const MissionCard = ({ mission }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{mission.name}</h3>
          <p className="text-gray-400 text-sm font-mono">{mission.id}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(mission.priority)} uppercase`}>
            {mission.priority}
          </span>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(mission.status)}`}></div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-gray-300 text-sm">{mission.objective}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Agent:</span>
            <span className="text-white ml-2">{mission.agent}</span>
          </div>
          <div>
            <span className="text-gray-400">Location:</span>
            <span className="text-white ml-2">{mission.location}</span>
          </div>
          <div>
            <span className="text-gray-400">Start Date:</span>
            <span className="text-white ml-2">{mission.startDate}</span>
          </div>
          <div>
            <span className="text-gray-400">Last Update:</span>
            <span className="text-white ml-2">{mission.lastUpdate}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 text-sm">Progress</span>
            <span className="text-white text-sm">{mission.progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{width: `${mission.progress}%`}}
            ></div>
          </div>
        </div>

        <div className="flex space-x-2 mt-4">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
            View Details
          </button>
          <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Active Missions</h1>
        <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          + New Mission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-green-400">12</div>
          <div className="text-gray-400 text-sm">Active Operations</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-yellow-400">5</div>
          <div className="text-gray-400 text-sm">In Planning</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-blue-400">23</div>
          <div className="text-gray-400 text-sm">Completed</div>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <select className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600">
          <option>All Statuses</option>
          <option>Active</option>
          <option>Planning</option>
          <option>Completed</option>
          <option>On Hold</option>
        </select>
        <select className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600">
          <option>All Priorities</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <input 
          type="text" 
          placeholder="Search missions..." 
          className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 flex-1"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </div>
    </div>
  );
}