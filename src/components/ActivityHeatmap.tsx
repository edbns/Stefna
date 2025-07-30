import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, FireIcon } from '@heroicons/react/24/outline';

interface HeatmapData {
  date: string;
  value: number;
  posts: number;
  engagement: number;
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
  year?: number;
  onDateClick?: (date: string, data: HeatmapData) => void;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  year = new Date().getFullYear(),
  onDateClick
}) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'value' | 'posts' | 'engagement'>('value');

  const { weeks, maxValue, minValue } = useMemo(() => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const weeks: Array<Array<{ date: string; data: HeatmapData | null }>> = [];
    
    let currentWeek: Array<{ date: string; data: HeatmapData | null }> = [];
    let currentDate = new Date(startDate);
    
    // Add empty days at the beginning if year doesn't start on Sunday
    const startDay = startDate.getDay();
    for (let i = 0; i < startDay; i++) {
      currentWeek.push({ date: '', data: null });
    }
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = data.find(d => d.date === dateStr);
      
      currentWeek.push({
        date: dateStr,
        data: dayData || { date: dateStr, value: 0, posts: 0, engagement: 0 }
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', data: null });
      }
      weeks.push(currentWeek);
    }
    
    const values = data.map(d => d[selectedMetric]);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    
    return { weeks, maxValue, minValue };
  }, [data, year, selectedMetric]);

  const getIntensity = (value: number) => {
    if (value === 0) return 0;
    return Math.min(Math.max((value - minValue) / (maxValue - minValue), 0.1), 1);
  };

  const getColor = (intensity: number) => {
    if (intensity === 0) return '#f3f4f6';
    const opacity = intensity;
    return `rgba(42, 65, 82, ${opacity})`;
  };

  const formatTooltip = (data: HeatmapData) => {
    const date = new Date(data.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return {
      date,
      value: data.value,
      posts: data.posts,
      engagement: data.engagement
    };
  };

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-[#2a4152]/10 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#2a4152]/10 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-[#2a4152]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#2a4152] font-['Figtree']">
              Activity Heatmap {year}
            </h3>
            <p className="text-sm text-[#2a4152]/70 font-['Figtree']">
              Daily activity visualization
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {[
            { key: 'value', label: 'Activity' },
            { key: 'posts', label: 'Posts' },
            { key: 'engagement', label: 'Engagement' }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedMetric(option.key as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium font-['Figtree'] transition-all ${
                selectedMetric === option.key
                    ? 'bg-black text-white'
  : 'bg-black/5 text-black hover:bg-black/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="relative">
        {/* Month labels */}
        <div className="flex mb-2 ml-8">
          {monthLabels.map((month, index) => (
            <div
              key={month}
              className="flex-1 text-xs text-[#2a4152]/60 font-['Figtree'] text-center"
              style={{ minWidth: `${100/12}%` }}
            >
              {month}
            </div>
          ))}
        </div>
        
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-2">
            {dayLabels.map((day, index) => (
              <div
                key={day}
                className="h-3 flex items-center text-xs text-[#2a4152]/60 font-['Figtree'] mb-1"
                style={{ display: index % 2 === 1 ? 'flex' : 'none' }}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex space-x-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {week.map((day, dayIndex) => {
                  if (!day.data) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }
                  
                  const intensity = getIntensity(day.data[selectedMetric]);
                  const isHovered = hoveredDate === day.date;
                  
                  return (
                    <motion.div
                      key={dayIndex}
                      whileHover={{ scale: 1.2 }}
                      className="w-3 h-3 rounded-sm cursor-pointer relative"
                      style={{ backgroundColor: getColor(intensity) }}
                      onMouseEnter={() => setHoveredDate(day.date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      onClick={() => onDateClick?.(day.date, day.data!)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10"
                        >
                          <div className="bg-[#2a4152] text-[#eee9dd] px-3 py-2 rounded-lg shadow-lg text-xs font-['Figtree'] whitespace-nowrap">
                            <div className="font-medium mb-1">
                              {formatTooltip(day.data).date}
                            </div>
                            <div>Activity: {day.data.value}</div>
                            <div>Posts: {day.data.posts}</div>
                            <div>Engagement: {day.data.engagement}</div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#2a4152]/60 font-['Figtree']">
              Less
            </span>
            <div className="flex space-x-1">
              {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: getColor(intensity) }}
                />
              ))}
            </div>
            <span className="text-xs text-[#2a4152]/60 font-['Figtree']">
              More
            </span>
          </div>
          
          <div className="flex items-center space-x-1 text-xs text-[#2a4152]/60 font-['Figtree']">
            <FireIcon className="w-4 h-4" />
            <span>Peak: {maxValue}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityHeatmap;