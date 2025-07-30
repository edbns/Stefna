import React from 'react';
import { Users, MapPin, Clock, TrendingUp, UserPlus, UserMinus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Audience: React.FC = () => {
  const { t } = useLanguage();

  const audienceStats = [
    { label: 'Total Followers', value: '156.2K', change: '+5.8%', icon: Users },
    { label: 'New Followers', value: '+2.4K', change: '+12%', icon: UserPlus },
    { label: 'Unfollows', value: '342', change: '-8%', icon: UserMinus },
    { label: 'Engagement Rate', value: '8.2%', change: '+2.1%', icon: TrendingUp }
  ];

  const demographics = [
    { age: '18-24', percentage: 35, color: 'bg-blue-500' },
    { age: '25-34', percentage: 28, color: 'bg-green-500' },
    { age: '35-44', percentage: 20, color: 'bg-yellow-500' },
    { age: '45-54', percentage: 12, color: 'bg-purple-500' },
    { age: '55+', percentage: 5, color: 'bg-red-500' }
  ];

  const topLocations = [
    { country: 'United States', percentage: 42, flag: '🇺🇸' },
    { country: 'United Kingdom', percentage: 18, flag: '🇬🇧' },
    { country: 'Canada', percentage: 12, flag: '🇨🇦' },
    { country: 'Australia', percentage: 8, flag: '🇦🇺' },
    { country: 'Germany', percentage: 6, flag: '🇩🇪' }
  ];

  const activeHours = [
    { hour: '6 AM', activity: 15 },
    { hour: '9 AM', activity: 45 },
    { hour: '12 PM', activity: 80 },
    { hour: '3 PM', activity: 65 },
    { hour: '6 PM', activity: 90 },
    { hour: '9 PM', activity: 100 },
    { hour: '12 AM', activity: 25 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-button" />
        <h1 className="text-3xl font-bold text-button font-['Figtree']">
          {t('nav.audience')}
        </h1>
      </div>

      {/* Audience Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {audienceStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-8 h-8 text-button" />
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600 font-['Figtree']">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Demographics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 font-['Figtree']">Age Demographics</h2>
          <div className="space-y-4">
            {demographics.map((demo, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">{demo.age}</span>
                <div className="flex items-center gap-3 flex-1 ml-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${demo.color}`}
                      style={{ width: `${demo.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-600 text-sm w-12 text-right">{demo.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 font-['Figtree']">Top Locations</h2>
          <div className="space-y-4">
            {topLocations.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{location.flag}</span>
                  <span className="text-gray-700 font-medium">{location.country}</span>
                </div>
                <span className="text-gray-600 font-medium">{location.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Hours */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 font-['Figtree']">Most Active Hours</h2>
        <div className="flex items-end justify-between gap-2 h-32">
          {activeHours.map((hour, index) => (
            <div key={index} className="flex flex-col items-center gap-2 flex-1">
              <div 
                className="bg-button rounded-t w-full transition-all hover:bg-button-hover"
                style={{ height: `${hour.activity}%` }}
              ></div>
              <span className="text-xs text-gray-600 text-center">{hour.hour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Audience;