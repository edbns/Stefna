import React, { useState, useEffect, useRef } from 'react';
import { Globe, TrendingUp, Users, MapPin } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useLanguage } from '../contexts/LanguageContext';

interface CountryData {
  name: string;
  posts: string;
  engagement: number;
  growth: number;
  coordinates: [number, number];
  countryCode: string;
}

interface GlobalData {
  // Define the structure based on your API response
  countries: CountryData[];
  // Add other fields as needed
}

// Mock service for now - replace with actual service
const globalReachService = {
  getGlobalData: async (): Promise<GlobalData | null> => {
    // This should be replaced with actual API call
    return null;
  }
};

const GlobalReach: React.FC = () => {
  const { t } = useLanguage();
  const [globalData, setGlobalData] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only fetch real data
        const data = await globalReachService.getGlobalData();
        setGlobalData(data?.countries || []);
      } catch (err) {
        console.error('Error fetching global data:', err);
        setError('Failed to load global reach data');
        setGlobalData([]); // Set empty array instead of mock data
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalData();
  }, []);

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 9) return '#10b981'; // Green
    if (engagement >= 8) return '#f59e0b'; // Orange
    if (engagement >= 6) return '#ef4444'; // Red
    return '#6b7280'; // Gray
  };

  const getEngagementLevel = (engagement: number) => {
    if (engagement >= 9) return 'Excellent';
    if (engagement >= 8) return 'Good';
    if (engagement >= 6) return 'Average';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Global Reach</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Grid View
            </button>
          </div>
        </div>
      </div>

      {globalData.length === 0 ? (
        <div className="text-center py-8">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No global reach data available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Your existing map/grid view implementation */}
          <div className="text-center py-8">
            <p className="text-gray-600">Global reach visualization will be displayed here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalReach;