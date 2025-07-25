import React, { useState, useEffect } from 'react';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState({
    missionSuccessRate: 87.3,
    threatNeutralized: 156,
    intelligenceGathered: 2847,
    agentEffectiveness: 94.2,
    responseTime: 23.5,
    budgetUtilization: 78.9
  });

  const [chartData] = useState({
    missions: [
      { month: 'Jan', successful: 23, failed: 2, ongoing: 8 },
      { month: 'Feb', successful: 27, failed: 1, ongoing: 12 },
      { month: 'Mar', successful: 31, failed: 3, ongoing: 15 },
      { month: 'Apr', successful: 29, failed: 2, ongoing: 18 },
      { month: 'May', successful: 35, failed: 1, ongoing: 22 },
      { month: 'Jun', successful: 33, failed: 4, ongoing: 19 }
    ],
    threats: [
      { type: 'Terrorism', count: 45, severity: 'high' },
      { type: 'Cyber Attacks', count: 62, severity: 'critical' },
      { type: 'Espionage', count: 38, severity: 'medium' },
      { type: 'Arms Trafficking', count: 29, severity: 'high' },
      { type: 'Money Laundering', count: 51, severity: 'medium' }
    ],
    regions: [
      { region: 'Europe', operations: 127, success: 89 },
      { region: 'Asia Pacific', operations: 94, success: 82 },
      { region: 'Middle East', operations: 73, success: 91 },
      { region: 'Americas', operations: 86, success: 87 },
      { region: 'Africa', operations: 41, success: 85 }
    ]
  });

  const [realtimeData, setRealtimeData] = useState({
    activeOperations: 28,
    threatsDetected: 7,
    agentsDeployed: 156,
    systemAlerts: 3
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        ...prev,
        threatsDetected: prev.threatsDetected + (Math.random() > 0.8 ? 1 : 0),
        systemAlerts: Math.max(0, prev.systemAlerts + (Math.random() > 0.9 ? 1 : -1))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ title, value, unit, trend, color = 'blue' }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-400 text-sm">{title}</h3>
        <span className={`text-${trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'gray'}-400 text-sm`}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
        </span>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className={`text-2xl font-bold text-${color}-400`}>{value}</span>
        <span className="text-gray-400 text-sm">{unit}</span>
      </div>
    </div>
  );

  const BarChart = ({ data, title }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">{item.month || item.type || item.region}</span>
              <span className="text-white">{item.successful || item.count || item.operations}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{width: `${((item.successful || item.count || item.operations) / Math.max(...data.map(d => d.successful || d.count || d.operations))) * 100}%`}}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ThreatAnalysis = ({ threats }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-bold text-white mb-4">Threat Analysis</h3>
      <div className="space-y-3">
        {threats.map((threat, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
            <div>
              <h4 className="text-white font-medium">{threat.type}</h4>
              <p className="text-gray-400 text-sm">{threat.count} incidents</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              threat.severity === 'critical' ? 'bg-red-600 text-white' :
              threat.severity === 'high' ? 'bg-orange-600 text-white' :
              'bg-yellow-600 text-black'
            }`}>
              {threat.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Analytics & Reports</h1>
        <div className="flex items-center space-x-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard 
          title="Mission Success Rate" 
          value={metrics.missionSuccessRate} 
          unit="%" 
          trend="up" 
          color="green" 
        />
        <MetricCard 
          title="Threats Neutralized" 
          value={metrics.threatNeutralized} 
          unit="total" 
          trend="up" 
          color="red" 
        />
        <MetricCard 
          title="Intelligence Gathered" 
          value={metrics.intelligenceGathered} 
          unit="reports" 
          trend="up" 
          color="blue" 
        />
        <MetricCard 
          title="Agent Effectiveness" 
          value={metrics.agentEffectiveness} 
          unit="%" 
          trend="stable" 
          color="purple" 
        />
        <MetricCard 
          title="Avg Response Time" 
          value={metrics.responseTime} 
          unit="min" 
          trend="down" 
          color="yellow" 
        />
        <MetricCard 
          title="Budget Utilization" 
          value={metrics.budgetUtilization} 
          unit="%" 
          trend="up" 
          color="teal" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-blue-400">{realtimeData.activeOperations}</div>
          <div className="text-gray-400 text-sm">Active Operations</div>
          <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mt-2 animate-pulse"></div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-red-400">{realtimeData.threatsDetected}</div>
          <div className="text-gray-400 text-sm">Threats Detected</div>
          <div className="w-3 h-3 bg-red-400 rounded-full mx-auto mt-2 animate-pulse"></div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-green-400">{realtimeData.agentsDeployed}</div>
          <div className="text-gray-400 text-sm">Agents Deployed</div>
          <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mt-2 animate-pulse"></div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-yellow-400">{realtimeData.systemAlerts}</div>
          <div className="text-gray-400 text-sm">System Alerts</div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full mx-auto mt-2 animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChart data={chartData.missions} title="Mission Performance (6 Months)" />
        <ThreatAnalysis threats={chartData.threats} />
        <BarChart data={chartData.regions} title="Regional Operations" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Performance Trends</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Mission Success Rate</span>
                <span className="text-green-400 text-sm">+2.3% from last month</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '87%'}}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Intelligence Quality</span>
                <span className="text-blue-400 text-sm">+5.1% from last month</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '92%'}}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Response Time</span>
                <span className="text-yellow-400 text-sm">-1.2 min from last month</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '76%'}}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Agent Safety Score</span>
                <span className="text-purple-400 text-sm">+0.8% from last month</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{width: '94%'}}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Predictive Analysis</h3>
          <div className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">Threat Prediction</h4>
              <p className="text-gray-300 text-sm">High probability of cyber attack in Eastern Europe within 72 hours</p>
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-400 text-xs">Confidence: 87%</span>
              </div>
            </div>
            
            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
              <h4 className="text-yellow-400 font-medium mb-2">Resource Allocation</h4>
              <p className="text-gray-300 text-sm">Recommend increasing surveillance in Middle East region</p>
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-400 text-xs">Priority: Medium</span>
              </div>
            </div>
            
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
              <h4 className="text-green-400 font-medium mb-2">Mission Success</h4>
              <p className="text-gray-300 text-sm">Operation Nightfall has 94% probability of success</p>
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-xs">Updated: 1 hour ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}