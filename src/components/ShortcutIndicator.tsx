import React from 'react';
import { motion } from 'framer-motion';

interface ShortcutIndicatorProps {
  shortcut: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ShortcutIndicator: React.FC<ShortcutIndicatorProps> = ({
  shortcut,
  className = '',
  size = 'sm'
}) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const keys = shortcut.split(' + ');

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-[#2a4152]/40 text-xs font-['Figtree']">
              +
            </span>
          )}
          <motion.kbd
            whileHover={{ scale: 1.05 }}
            className={`
              bg-white border border-[#2a4152]/20 rounded font-mono text-[#2a4152] 
              shadow-sm inline-flex items-center justify-center min-w-[1.5rem] 
              ${sizeClasses[size]}
            `}
          >
            {key}
          </motion.kbd>
        </React.Fragment>
      ))}
    </div>
  );
};

export default ShortcutIndicator;