import React from 'react';
import { BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Add premium analytics section
import PremiumFeatureGate from './PremiumFeatureGate';

interface AnalyticsProps {
  onAuthOpen: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onAuthOpen }) => {
  const { t } = useLanguage();
  
  const metrics = [
    { label: 'Total Views', value: '2.4M', change: '+12.5%', icon: Eye, color: 'text-blue-600' },
    { label: 'Engagement Rate', value: '8.2%', change: '+2.1%', icon: Heart, color: 'text-red-600' },
    { label: 'Total Followers', value: '156K', change: '+5.8%', icon: Users, color: 'text-green-600' },
    { label: 'Shares', value: '45.2K', change: '+18.3%', icon: Share2, color: 'text-purple-600' }
  ];

  const platformData = [
    { platform: 'YouTube', views: '1.2M', engagement: '9.1%', growth: '+15%' },
    { platform: 'TikTok', views: '800K', engagement: '12.3%', growth: '+22%' },
    { platform: 'Instagram', views: '300K', engagement: '6.8%', growth: '+8%' },
    { platform: 'Twitter/X', views: '100K', engagement: '4.2%', growth: '+3%' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-button" />
        <h1 className="text-3xl font-bold text-button font-['Figtree']">
          {t('nav.analytics')}
        </h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${metric.color}`} />
                <span className="text-sm font-medium text-green-600">{metric.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-gray-600 font-['Figtree']">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Platform Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 font-['Figtree']">Platform Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Platform</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Views</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Engagement</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Growth</th>
              </tr>
            </thead>
            <tbody>
              {platformData.map((platform, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">{platform.platform}</td>
                  <td className="py-4 px-4 text-gray-700">{platform.views}</td>
                  <td className="py-4 px-4 text-gray-700">{platform.engagement}</td>
                  <td className="py-4 px-4 text-green-600 font-medium">{platform.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-['Figtree']">Engagement Over Time</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart visualization would go here</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-['Figtree']">Platform Distribution</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Pie chart would go here</p>
          </div>
        </div>
      </div>
      
      {/* Advanced Analytics - Direct Display */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Advanced Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Engagement Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Click-through Rate:</span>
                <span className="font-semibold text-blue-600">3.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conversion Rate:</span>
                <span className="font-semibold text-green-600">1.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bounce Rate:</span>
                <span className="font-semibold text-red-600">24.5%</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Predictions</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Next Month:</span>
                <span className="font-semibold text-green-600">+15.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Quarter:</span>
                <span className="font-semibold text-green-600">+42.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-semibold text-blue-600">87%</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Insights</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Peak Activity:</span>
                <span className="font-semibold text-purple-600">2-4 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top Demographics:</span>
                <span className="font-semibold text-purple-600">18-34</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Retention Rate:</span>
                <span className="font-semibold text-green-600">68.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;