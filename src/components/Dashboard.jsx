import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeMissions: 12,
    agentsDeployed: 28,
    threatsDetected: 3,
    dataPacketsProcessed: 1247829
  });

  const [activities, setActivities] = useState([
    { id: 1, type: 'mission', message: 'Operation Nightfall initiated', time: '2 minutes ago', status: 'active' },
    { id: 2, type: 'alert', message: 'New intelligence report received', time: '5 minutes ago', status: 'info' },
    { id: 3, type: 'intel', message: 'Agent Bravo checked in from Berlin', time: '8 minutes ago', status: 'success' },
    { id: 4, type: 'agent', message: 'System maintenance completed', time: '12 minutes ago', status: 'success' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        dataPacketsProcessed: prev.dataPacketsProcessed + Math.floor(Math.random() * 100),
        threatsDetected: prev.threatsDetected + (Math.random() > 0.95 ? 1 : 0)
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon, gradient = 'from-blue-500 to-purple-500', textColor = 'text-blue-400' }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold ${textColor} mt-2`}>{value}</p>
        </div>
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <span className="text-white text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const statusStyles = {
      active: 'border-l-blue-400 bg-blue-500/10',
      info: 'border-l-emerald-400 bg-emerald-500/10',
      success: 'border-l-emerald-400 bg-emerald-500/10',
      warning: 'border-l-yellow-400 bg-yellow-500/10'
    };

    return (
      <div className={`flex items-start space-x-4 p-4 hover:bg-slate-700/50 rounded-xl transition-colors border-l-4 ${statusStyles[activity.status]}`}>
        <div className="flex-1">
          <p className="text-white font-medium">{activity.message}</p>
          <p className="text-slate-400 text-sm mt-1">{activity.time}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Command Center</h1>
          <p className="text-slate-400 text-lg">Your intelligence operations at a glance</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-700/50">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
          <span className="text-emerald-400 font-mono font-medium">SYSTEM OPERATIONAL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Missions" 
          value={stats.activeMissions} 
          icon="🚀" 
          gradient="from-blue-500 to-cyan-500"
          textColor="text-cyan-400"
        />
        <StatCard 
          title="Agents Deployed" 
          value={stats.agentsDeployed} 
          icon="👥" 
          gradient="from-purple-500 to-pink-500"
          textColor="text-purple-400"
        />
        <StatCard 
          title="Alerts Today" 
          value={stats.threatsDetected} 
          icon="🔔" 
          gradient="from-yellow-500 to-orange-500"
          textColor="text-yellow-400"
        />
        <StatCard 
          title="Data Processed" 
          value={stats.dataPacketsProcessed.toLocaleString()} 
          icon="📊" 
          gradient="from-emerald-500 to-teal-500"
          textColor="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Global Operations Overview</h2>
          <div className="bg-slate-900/50 rounded-xl h-80 flex items-center justify-center border border-slate-600/50">
            <div className="text-center">
              <div className="text-6xl mb-4">🌍</div>
              <p className="text-slate-300 text-lg mb-2">Interactive world map</p>
              <p className="text-slate-400">Real-time global intelligence monitoring</p>
              <div className="mt-6 flex justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                  <span className="text-sm text-slate-300">Active Operations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                  <span className="text-sm text-slate-300">Agent Locations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"></div>
                  <span className="text-sm text-slate-300">Areas of Interest</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
              🛡️
            </span>
            Security Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Threat Level</span>
              <span className="text-emerald-400 font-bold">LOW</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full shadow-lg" style={{width: '35%'}}></div>
            </div>
            <p className="text-slate-400 text-sm">All systems secure and operational</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
              🌐
            </span>
            Network Health
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Encrypted Channels</span>
              <span className="text-emerald-400">✓ Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Firewall Status</span>
              <span className="text-emerald-400">✓ Protected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">VPN Tunnels</span>
              <span className="text-emerald-400">✓ 28/28</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
              ⚡
            </span>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
              New Mission
            </button>
            <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
              Deploy Agent
            </button>
            <button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}