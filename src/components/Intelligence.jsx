import React, { useState } from 'react';

export default function Intelligence() {
  const [reports] = useState([
    {
      id: 'INT-001',
      title: 'Eastern European Terrorist Network Analysis',
      classification: 'Top Secret',
      source: 'HUMINT',
      priority: 'critical',
      date: '2024-01-18',
      summary: 'Identified new terrorist cell operating across three countries with suspected WMD capabilities',
      confidence: 85,
      tags: ['terrorism', 'wmd', 'europe']
    },
    {
      id: 'INT-002',
      title: 'Cyber Warfare Capabilities Assessment',
      classification: 'Secret',
      source: 'SIGINT',
      priority: 'high',
      date: '2024-01-17',
      summary: 'Foreign state actor developing advanced cyber warfare tools targeting critical infrastructure',
      confidence: 92,
      tags: ['cyber', 'infrastructure', 'state-actor']
    },
    {
      id: 'INT-003',
      title: 'Arms Trafficking Route Intelligence',
      classification: 'Confidential',
      source: 'GEOINT',
      priority: 'medium',
      date: '2024-01-16',
      summary: 'Satellite imagery reveals new arms trafficking routes through Mediterranean ports',
      confidence: 78,
      tags: ['arms-trafficking', 'mediterranean', 'ports']
    }
  ]);

  const [signals] = useState([
    { frequency: '156.8 MHz', location: 'Moscow', type: 'Encrypted', strength: 'Strong', status: 'Active' },
    { frequency: '432.1 MHz', location: 'Berlin', type: 'Voice', strength: 'Weak', status: 'Monitoring' },
    { frequency: '89.5 MHz', location: 'Tehran', type: 'Data', strength: 'Medium', status: 'Intercepted' },
    { frequency: '203.7 MHz', location: 'Beijing', type: 'Military', strength: 'Strong', status: 'Classified' }
  ]);

  const getClassificationColor = (classification) => {
    switch(classification) {
      case 'Top Secret': return 'bg-red-600 text-white';
      case 'Secret': return 'bg-orange-600 text-white';
      case 'Confidential': return 'bg-yellow-600 text-black';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const ReportCard = ({ report }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2">{report.title}</h3>
          <p className="text-gray-400 text-sm font-mono">{report.id}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getClassificationColor(report.classification)}`}>
            {report.classification}
          </span>
          <span className={`text-sm font-medium ${getPriorityColor(report.priority)}`}>
            {report.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-4">{report.summary}</p>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-gray-400">Source:</span>
          <span className="text-white ml-2 font-mono">{report.source}</span>
        </div>
        <div>
          <span className="text-gray-400">Date:</span>
          <span className="text-white ml-2">{report.date}</span>
        </div>
        <div>
          <span className="text-gray-400">Confidence:</span>
          <span className="text-white ml-2">{report.confidence}%</span>
        </div>
        <div>
          <span className="text-gray-400">Tags:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {report.tags.map((tag, index) => (
              <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-400 text-sm">Confidence Level</span>
          <span className="text-white text-sm">{report.confidence}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full" 
            style={{width: `${report.confidence}%`}}
          ></div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
          Full Report
        </button>
        <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
          Share Intel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Intelligence Center</h1>
        <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          + New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-red-400">127</div>
          <div className="text-gray-400 text-sm">Intelligence Reports</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-blue-400">89</div>
          <div className="text-gray-400 text-sm">Signal Intercepts</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-yellow-400">34</div>
          <div className="text-gray-400 text-sm">Active Sources</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-green-400">97%</div>
          <div className="text-gray-400 text-sm">Accuracy Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Recent Intelligence Reports</h2>
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Signal Intelligence</h3>
            <div className="space-y-3">
              {signals.map((signal, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-3 border border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-blue-400 font-mono text-sm">{signal.frequency}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      signal.status === 'Active' ? 'bg-green-600' :
                      signal.status === 'Intercepted' ? 'bg-red-600' :
                      signal.status === 'Classified' ? 'bg-purple-600' : 'bg-yellow-600'
                    } text-white`}>
                      {signal.status}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span className="text-white">{signal.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">{signal.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Strength:</span>
                      <span className="text-white">{signal.strength}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Analysis Tools</h3>
            <div className="space-y-3">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                🧠 AI Pattern Analysis
              </button>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                📡 Signal Decoder
              </button>
              <button className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                🔍 Image Analysis
              </button>
              <button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                📊 Data Correlation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}