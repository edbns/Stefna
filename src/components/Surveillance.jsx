import React, { useState, useEffect } from 'react';

export default function Surveillance() {
  const [cameras] = useState([
    { id: 'CAM-001', location: 'Embassy District, Moscow', status: 'active', type: 'PTZ', feed: 'live' },
    { id: 'CAM-002', location: 'Port Authority, Hamburg', status: 'active', type: 'Fixed', feed: 'live' },
    { id: 'CAM-003', location: 'Airport Terminal 3, Dubai', status: 'maintenance', type: 'Thermal', feed: 'offline' },
    { id: 'CAM-004', location: 'Financial District, Hong Kong', status: 'active', type: 'PTZ', feed: 'live' },
    { id: 'CAM-005', location: 'Government Quarter, Berlin', status: 'active', type: 'Night Vision', feed: 'live' },
    { id: 'CAM-006', location: 'Industrial Zone, Tehran', status: 'compromised', type: 'Fixed', feed: 'offline' }
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, location: 'Embassy District, Moscow', type: 'Motion Detected', time: '2 min ago', severity: 'high' },
    { id: 2, location: 'Port Authority, Hamburg', type: 'Facial Recognition Match', time: '15 min ago', severity: 'critical' },
    { id: 3, location: 'Airport Terminal 3, Dubai', type: 'System Offline', time: '1 hour ago', severity: 'medium' },
    { id: 4, location: 'Financial District, Hong Kong', type: 'Unusual Activity', time: '2 hours ago', severity: 'low' }
  ]);

  const [surveillanceStats, setSurveillanceStats] = useState({
    activeCameras: 156,
    totalAlerts: 847,
    recognitionHits: 23,
    systemUptime: 99.7
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSurveillanceStats(prev => ({
        ...prev,
        totalAlerts: prev.totalAlerts + (Math.random() > 0.7 ? 1 : 0),
        recognitionHits: prev.recognitionHits + (Math.random() > 0.95 ? 1 : 0)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'compromised': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'border-l-red-500 bg-red-900/20';
      case 'high': return 'border-l-orange-500 bg-orange-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-900/20';
      case 'low': return 'border-l-green-500 bg-green-900/20';
      default: return 'border-l-gray-500 bg-gray-900/20';
    }
  };

  const CameraFeed = ({ camera }) => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium text-sm">{camera.id}</h4>
            <p className="text-gray-400 text-xs">{camera.location}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">{camera.type}</span>
            <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)}`}></div>
          </div>
        </div>
      </div>
      <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
        {camera.feed === 'live' ? (
          <div className="text-center">
            <div className="text-4xl mb-2">📹</div>
            <div className="text-green-400 text-xs font-mono animate-pulse">● LIVE FEED</div>
            <div className="text-gray-500 text-xs mt-1">
              {Math.floor(Math.random() * 60):Math.floor(Math.random() * 60).toString().padStart(2, '0')}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-2 text-gray-600">📹</div>
            <div className="text-red-400 text-xs font-mono">● OFFLINE</div>
          </div>
        )}
      </div>
    </div>
  );

  const AlertItem = ({ alert }) => (
    <div className={`p-3 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-white font-medium text-sm">{alert.type}</h4>
          <p className="text-gray-400 text-xs">{alert.location}</p>
        </div>
        <span className="text-gray-400 text-xs">{alert.time}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Surveillance Center</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-mono text-sm">MONITORING ACTIVE</span>
          </div>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Emergency View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-green-400">{surveillanceStats.activeCameras}</div>
          <div className="text-gray-400 text-sm">Active Cameras</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-yellow-400">{surveillanceStats.totalAlerts}</div>
          <div className="text-gray-400 text-sm">Total Alerts</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-red-400">{surveillanceStats.recognitionHits}</div>
          <div className="text-gray-400 text-sm">Recognition Hits</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-blue-400">{surveillanceStats.systemUptime}%</div>
          <div className="text-gray-400 text-sm">System Uptime</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Live Camera Feeds</h2>
            <div className="flex space-x-2">
              <select className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600">
                <option>All Locations</option>
                <option>Moscow</option>
                <option>Hamburg</option>
                <option>Dubai</option>
                <option>Hong Kong</option>
                <option>Berlin</option>
                <option>Tehran</option>
              </select>
              <select className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600">
                <option>All Status</option>
                <option>Active</option>
                <option>Maintenance</option>
                <option>Offline</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cameras.map((camera) => (
              <CameraFeed key={camera.id} camera={camera} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Recent Alerts</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Facial Recognition</h3>
            <div className="space-y-3">
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">👤</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Target #1847</p>
                    <p className="text-red-400 text-sm">High Priority</p>
                    <p className="text-gray-400 text-xs">Last seen: Hong Kong</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">👤</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Person of Interest</p>
                    <p className="text-yellow-400 text-sm">Medium Priority</p>
                    <p className="text-gray-400 text-xs">Last seen: Berlin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">System Controls</h3>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                📡 Auto-Track Mode
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                🎯 Target Recognition
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                🔄 System Refresh
              </button>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                🚨 Emergency Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}