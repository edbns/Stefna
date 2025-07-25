import React, { useState, useEffect } from 'react';

export default function Agents() {
  const [agents] = useState([
    {
      id: 'A-001',
      codename: 'Agent Alpha',
      realName: '[CLASSIFIED]',
      status: 'active',
      location: 'Moscow, Russia',
      mission: 'Operation Nightfall',
      clearanceLevel: 9,
      lastContact: '2 hours ago',
      skillset: ['Infiltration', 'Combat', 'Tech'],
      cover: 'Business Executive',
      emergencyCode: 'RAVEN'
    },
    {
      id: 'A-002',
      codename: 'Agent Bravo',
      realName: '[CLASSIFIED]',
      status: 'deep-cover',
      location: 'Berlin, Germany',
      mission: 'Project Blackout',
      clearanceLevel: 8,
      lastContact: '6 hours ago',
      skillset: ['Surveillance', 'Languages', 'Analysis'],
      cover: 'Journalist',
      emergencyCode: 'FALCON'
    },
    {
      id: 'A-003',
      codename: 'Agent Charlie',
      realName: '[CLASSIFIED]',
      status: 'available',
      location: 'Tokyo, Japan',
      mission: 'Shadow Protocol (Completed)',
      clearanceLevel: 7,
      lastContact: '30 minutes ago',
      skillset: ['Cyber', 'Electronics', 'Stealth'],
      cover: 'Software Engineer',
      emergencyCode: 'EAGLE'
    },
    {
      id: 'A-004',
      codename: 'Agent Delta',
      realName: '[CLASSIFIED]',
      status: 'compromised',
      location: 'Paris, France',
      mission: 'Silent Storm (On Hold)',
      clearanceLevel: 6,
      lastContact: '3 days ago',
      skillset: ['Negotiation', 'Finance', 'Networks'],
      cover: 'Investment Banker',
      emergencyCode: 'PHOENIX'
    },
    {
      id: 'A-005',
      codename: 'Agent Echo',
      realName: '[CLASSIFIED]',
      status: 'training',
      location: 'Langley, VA',
      mission: 'Advanced Training Program',
      clearanceLevel: 5,
      lastContact: '1 hour ago',
      skillset: ['Combat', 'Demolitions', 'Tactical'],
      cover: 'Military Contractor',
      emergencyCode: 'VIPER'
    },
    {
      id: 'A-006',
      codename: 'Agent Foxtrot',
      realName: '[CLASSIFIED]',
      status: 'extraction',
      location: 'Unknown',
      mission: 'Emergency Extraction',
      clearanceLevel: 8,
      lastContact: '12 hours ago',
      skillset: ['Escape', 'Survival', 'Medical'],
      cover: 'Relief Worker',
      emergencyCode: 'GHOST'
    }
  ]);

  const [agentStats, setAgentStats] = useState({
    totalAgents: 28,
    activeField: 12,
    deepCover: 6,
    available: 8,
    compromised: 2
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500 text-white';
      case 'deep-cover': return 'bg-blue-500 text-white';
      case 'available': return 'bg-gray-500 text-white';
      case 'compromised': return 'bg-red-500 text-white';
      case 'training': return 'bg-yellow-500 text-black';
      case 'extraction': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getClearanceColor = (level) => {
    if (level >= 8) return 'text-red-400';
    if (level >= 6) return 'text-orange-400';
    if (level >= 4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const AgentCard = ({ agent }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">{agent.codename.split(' ')[1][0]}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{agent.codename}</h3>
            <p className="text-gray-400 text-sm font-mono">{agent.id}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(agent.status)}`}>
            {agent.status.toUpperCase()}
          </span>
          <span className={`text-sm font-bold ${getClearanceColor(agent.clearanceLevel)}`}>
            Level {agent.clearanceLevel}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Location:</span>
            <span className="text-white ml-2">{agent.location}</span>
          </div>
          <div>
            <span className="text-gray-400">Last Contact:</span>
            <span className="text-white ml-2">{agent.lastContact}</span>
          </div>
          <div>
            <span className="text-gray-400">Cover:</span>
            <span className="text-white ml-2">{agent.cover}</span>
          </div>
          <div>
            <span className="text-gray-400">Emergency:</span>
            <span className="text-red-400 ml-2 font-mono">{agent.emergencyCode}</span>
          </div>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Current Mission:</span>
          <p className="text-white">{agent.mission}</p>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Skillset:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {agent.skillset.map((skill, index) => (
              <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
          Contact
        </button>
        <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
          Reassign
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm transition-colors">
          🚨
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Field Agents</h1>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Deploy Agent
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Emergency Recall
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-blue-400">{agentStats.totalAgents}</div>
          <div className="text-gray-400 text-sm">Total Agents</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-green-400">{agentStats.activeField}</div>
          <div className="text-gray-400 text-sm">Active Field</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-purple-400">{agentStats.deepCover}</div>
          <div className="text-gray-400 text-sm">Deep Cover</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-gray-400">{agentStats.available}</div>
          <div className="text-gray-400 text-sm">Available</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-red-400">{agentStats.compromised}</div>
          <div className="text-gray-400 text-sm">Compromised</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Agent Roster</h2>
            <div className="flex space-x-2">
              <select className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600">
                <option>All Status</option>
                <option>Active</option>
                <option>Deep Cover</option>
                <option>Available</option>
                <option>Compromised</option>
                <option>Training</option>
                <option>Extraction</option>
              </select>
              <select className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600">
                <option>All Clearance</option>
                <option>Level 9</option>
                <option>Level 8</option>
                <option>Level 7</option>
                <option>Level 6</option>
                <option>Level 5</option>
              </select>
              <input 
                type="text" 
                placeholder="Search agents..." 
                className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Global Deployment</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Europe</span>
                <span className="text-white">8 agents</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Asia Pacific</span>
                <span className="text-white">7 agents</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Middle East</span>
                <span className="text-white">5 agents</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Americas</span>
                <span className="text-white">6 agents</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Africa</span>
                <span className="text-white">2 agents</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Priority Alerts</h3>
            <div className="space-y-3">
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 font-medium text-sm">Agent Delta</span>
                </div>
                <p className="text-gray-300 text-xs">Missed scheduled check-in</p>
                <p className="text-gray-400 text-xs">3 days overdue</p>
              </div>
              
              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-400 font-medium text-sm">Agent Foxtrot</span>
                </div>
                <p className="text-gray-300 text-xs">Emergency extraction requested</p>
                <p className="text-gray-400 text-xs">12 hours ago</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                📡 Broadcast Message
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                🎯 Assign Mission
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                🔄 Status Update
              </button>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                🚨 Emergency Protocol
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}