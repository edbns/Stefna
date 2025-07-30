import React from 'react';
import { motion } from 'framer-motion';
import { GripVertical, X, Settings } from 'lucide-react';

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
  isDragging?: boolean;
  className?: string;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  id,
  title,
  children,
  onRemove,
  onSettings,
  isDragging = false,
  className = ''
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md group ${isDragging ? 'shadow-lg scale-105' : ''} ${className}`}
      style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <GripVertical 
            className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" 
            style={{ color: '#2a4152' }}
          />
          <h3 className="font-medium font-figtree" style={{ color: '#2a4152' }}>
            {title}
          </h3>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onSettings && (
            <button
              onClick={() => onSettings(id)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: '#2a4152' }}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(id)}
              className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
              style={{ color: '#2a4152' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Widget Content */}
      <div className="p-4">
        {children}
      </div>
    </motion.div>
  );
};

export default DashboardWidget;