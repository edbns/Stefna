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
    { id: 2, type: 'alert', message: 'Suspicious activity detected in Sector 7', time: '5 minutes ago', status: 'warning' },
    { id: 3, type: 'intel', message: 'New intelligence report received', time: '8 minutes ago', status: 'info' },
    { id: 4, type: 'agent', message: 'Agent Bravo checked in from Moscow', time: '12 minutes ago', status: 'success' }
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

  const StatCard = ({ title, value, icon, color = 'blue' }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold text-${color}-400 mt-1`}>{value}</p>
        </div>
        <div className={`text-3xl text-${color}-400`}>{icon}</div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const statusColors = {
      active: 'bg-blue-500',
      warning: 'bg-yellow-500',
      info: 'bg-green-500',
      success: 'bg-green-500'
    };

    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gray-700 rounded-lg">
        <div className={`w-2 h-2 rounded-full mt-2 ${statusColors[activity.status]}`}></div>
        <div className="flex-1">
          <p className="text-white">{activity.message}</p>
          <p className="text-gray-400 text-sm">{activity.time}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Command Center</h1>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-mono">SYSTEM OPERATIONAL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Missions" 
          value={stats.activeMissions} 
          icon="⚡" 
          color="red" 
        />
        <StatCard 
          title="Agents Deployed" 
          value={stats.agentsDeployed} 
          icon="🕴️" 
          color="blue" 
        />
        <StatCard 
          title="Threats Detected" 
          value={stats.threatsDetected} 
          icon="⚠️" 
          color="yellow" 
        />
        <StatCard 
          title="Data Processed" 
          value={stats.dataPacketsProcessed.toLocaleString()} 
          icon="📊" 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Global Operations Map</h2>
          <div className="bg-gray-900 rounded-lg h-64 flex items-center justify-center border border-gray-600">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-400">Interactive world map coming soon...</p>
              <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">Active Missions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">Agent Locations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">Threat Areas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">Security Level</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Current Level</span>
              <span className="text-red-400 font-bold">DEFCON 3</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">Network Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Encrypted Channels</span>
              <span className="text-green-400">✓ Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Firewall Status</span>
              <span className="text-green-400">✓ Secure</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">VPN Tunnels</span>
              <span className="text-green-400">✓ 28/28</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors">
              Emergency Protocol
            </button>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
              Deploy Agent
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}