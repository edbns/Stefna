import React from 'react';
import { BarChart3, Calendar, Clock, TrendingUp } from 'lucide-react';

interface StatCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

interface ProfileStatsProps {
  stats?: StatCard[];
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ 
  stats = [
    { 
      label: 'Posts Created', 
      value: '24', 
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-blue-500',
      change: '+12%'
    },
    { 
      label: 'Analytics Views', 
      value: '156', 
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-green-500',
      change: '+8%'
    },
    { 
      label: 'Scheduled Posts', 
      value: '8', 
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-yellow-500',
      change: '+3%'
    },
    { 
      label: 'Days Active', 
      value: '45', 
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-purple-500',
      change: '+5%'
    }
  ]
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${stat.color} text-white`}>
              {stat.icon}
            </div>
            {stat.change && (
              <span className="text-xs font-medium text-green-600">
                {stat.change}
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-800">
              {stat.value}
            </p>
            <p className="text-sm text-gray-600">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats; 