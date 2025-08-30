// Option Guard Component
// Conditionally renders option buttons only when they are configured

import React from 'react';
import { isConfigured, OPTION_GROUPS } from '../utils/presets';

interface OptionGuardProps {
  group: keyof typeof OPTION_GROUPS;
  optionKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const OptionGuard: React.FC<OptionGuardProps> = ({ 
  group, 
  optionKey, 
  children, 
  fallback = null 
}) => {
  const configured = OPTION_GROUPS[group]?.options?.[optionKey as keyof typeof OPTION_GROUPS[typeof group]['options']] !== undefined;
  
  if (!configured) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export default OptionGuard;

// Helper component for rendering a list of configured options
interface ConfiguredOptionsProps {
  group: keyof typeof OPTION_GROUPS;
  renderOption: (optionKey: string, option: any) => React.ReactNode;
  emptyMessage?: string;
}

export const ConfiguredOptions: React.FC<ConfiguredOptionsProps> = ({
  group,
  renderOption,
  emptyMessage = 'No options configured'
}) => {
  const groupOptions = OPTION_GROUPS[group];
  
  if (!groupOptions) {
    return <div className="text-white/60 text-sm">{emptyMessage}</div>;
  }
  
  const entries = Object.entries(groupOptions);
  
  if (entries.length === 0) {
    return <div className="text-white/60 text-sm">{emptyMessage}</div>;
  }
  
  return (
    <>
      {entries.map(([optionKey, option]) => (
        <React.Fragment key={optionKey}>
          {renderOption(optionKey, option)}
        </React.Fragment>
      ))}
    </>
  );
};

// Helper hook for checking if options are configured
export function useOptionConfiguration(group: keyof typeof OPTION_GROUPS) {
  const groupOptions = OPTION_GROUPS[group];
  const configuredCount = groupOptions ? Object.keys(groupOptions).length : 0;
  
  return {
    hasOptions: configuredCount > 0,
    optionCount: configuredCount,
    isConfigured: (optionKey: string) => OPTION_GROUPS[group]?.options?.[optionKey as keyof typeof OPTION_GROUPS[typeof group]['options']] !== undefined,
    getConfiguredKeys: () => groupOptions ? Object.keys(groupOptions) : []
  };
}
