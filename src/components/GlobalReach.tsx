import React, { useState, useEffect } from 'react';
import { Globe, TrendingUp, Users, Activity, MapPin } from 'lucide-react';

interface RegionData {
  id: string;
  name: string;
  value: number;
  color: string;
  engagement: number;
  posts: number;
  trendingTopics: string[];
  coordinates: [number, number];
}

const GlobalReach: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [dataLayer, setDataLayer] = useState<'engagement' | 'posts' | 'trending'>('engagement');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration - replace with real API data
  const mockData: RegionData[] = [
    {
      id: 'us',
      name: 'United States',
      value: 85,
      color: '#FF6B6B',
      engagement: 92,
      posts: 15420,
      trendingTopics: ['#AI', '#Tech', '#Innovation'],
      coordinates: [39.8283, -98.5795]
    },
    {
      id: 'eu',
      name: 'Europe',
      value: 78,
      color: '#4ECDC4',
      engagement: 87,
      posts: 12850,
      trendingTopics: ['#Sustainability', '#Travel', '#Food'],
      coordinates: [54.5260, 15.2551]
    },
    {
      id: 'asia',
      name: 'Asia',
      value: 92,
      color: '#45B7D1',
      engagement: 95,
      posts: 23400,
      trendingTopics: ['#KPop', '#Gaming', '#Fashion'],
      coordinates: [34.0479, 100.6197]
    },
    {
      id: 'africa',
      name: 'Africa',
      value: 65,
      color: '#96CEB4',
      engagement: 73,
      posts: 8900,
      trendingTopics: ['#Afrobeats', '#Startups', '#Culture'],
      coordinates: [8.7832, 34.5085]
    },
    {
      id: 'sa',
      name: 'South America',
      value: 71,
      color: '#FFEAA7',
      engagement: 79,
      posts: 11200,
      trendingTopics: ['#Soccer', '#Music', '#Nature'],
      coordinates: [-8.7832, -55.4915]
    },
    {
      id: 'au',
      name: 'Australia',
      value: 68,
      color: '#DDA0DD',
      engagement: 76,
      posts: 6800,
      trendingTopics: ['#Outdoors', '#Sports', '#Beach'],
      coordinates: [-25.2744, 133.7751]
    }
  ];

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getValueForLayer = (region: RegionData) => {
    switch (dataLayer) {
      case 'engagement':
        return region.engagement;
      case 'posts':
        return region.posts;
      case 'trending':
        return region.value;
      default:
        return region.engagement;
    }
  };

  const getColorForValue = (value: number) => {
    if (value >= 90) return '#FF6B6B';
    if (value >= 80) return '#4ECDC4';
    if (value >= 70) return '#45B7D1';
    if (value >= 60) return '#96CEB4';
    return '#DDA0DD';
  };

  const formatValue = (value: number) => {
    if (dataLayer === 'posts') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString();
    }
    return `${value}%`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-black" />
          <div>
            <h2 className="text-2xl font-bold text-black">Global Reach</h2>
            <p className="text-gray-600">Interactive social media activity heat map</p>
          </div>
        </div>
        
        {/* Data Layer Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setDataLayer('engagement')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dataLayer === 'engagement'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Engagement
          </button>
          <button
            onClick={() => setDataLayer('posts')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dataLayer === 'posts'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setDataLayer('trending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dataLayer === 'trending'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Trending
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="relative">
          {/* Interactive World Map */}
          <div className="relative bg-gray-50 rounded-lg p-8 h-96 overflow-hidden">
            {/* World Map Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Globe className="w-64 h-64 text-gray-400" />
            </div>
            
            {/* Interactive Regions */}
            <div className="relative z-10 h-full">
              {mockData.map((region) => {
                const value = getValueForLayer(region);
                const color = getColorForValue(value);
                
                return (
                  <div
                    key={region.id}
                    className="absolute cursor-pointer transition-all duration-300 hover:scale-110"
                    style={{
                      left: `${(region.coordinates[1] + 180) / 360 * 100}%`,
                      top: `${(90 - region.coordinates[0]) / 180 * 100}%`,
                    }}
                    onMouseEnter={() => setSelectedRegion(region)}
                    onMouseLeave={() => setSelectedRegion(null)}
                  >
                    {/* Region Marker */}
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-lg relative"
                      style={{ backgroundColor: color }}
                    >
                      {/* Pulse Animation */}
                      <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: color }}></div>
                    </div>
                    
                    {/* Region Label */}
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <div className="bg-black text-white px-2 py-1 rounded text-xs font-medium">
                        {region.name}
                      </div>
                      <div className="text-center text-xs font-bold mt-1" style={{ color }}>
                        {formatValue(value)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-400"></div>
              <span className="text-sm text-gray-600">High (90%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-teal-400"></div>
              <span className="text-sm text-gray-600">Medium-High (80-89%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-400"></div>
              <span className="text-sm text-gray-600">Medium (70-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-400"></div>
              <span className="text-sm text-gray-600">Low-Medium (60-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-400"></div>
              <span className="text-sm text-gray-600">Low (<60%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Region Details Tooltip */}
      {selectedRegion && (
        <div className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-5 h-5 text-black" />
            <h3 className="font-bold text-black">{selectedRegion.name}</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Engagement Rate:</span>
              <span className="font-semibold text-black">{selectedRegion.engagement}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Posts:</span>
              <span className="font-semibold text-black">{selectedRegion.posts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trending Score:</span>
              <span className="font-semibold text-black">{selectedRegion.value}%</span>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="text-gray-600 text-sm">Trending Topics:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedRegion.trendingTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-black text-xs rounded"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-black" />
            <div>
              <p className="text-sm text-gray-600">Global Engagement</p>
              <p className="text-2xl font-bold text-black">84.2%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-black" />
            <div>
              <p className="text-sm text-gray-600">Active Regions</p>
              <p className="text-2xl font-bold text-black">6</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-black" />
            <div>
              <p className="text-sm text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-black">78.5K</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalReach;