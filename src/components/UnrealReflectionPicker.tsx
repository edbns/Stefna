import React, { useState } from 'react';
import { UNREAL_REFLECTION_PRESETS, UnrealReflectionPreset } from '../presets/unrealReflection';

interface UnrealReflectionPickerProps {
  presets?: UnrealReflectionPreset[];
  value?: string;
  onChange?: (id: string) => void;
  disabled?: boolean;
  on3DToggle?: (enabled: boolean) => void;
}

export function UnrealReflectionPicker({
  presets = UNREAL_REFLECTION_PRESETS,
  value,
  onChange,
  disabled = false,
  on3DToggle,
}: UnrealReflectionPickerProps) {
  const [is3DEnabled, setIs3DEnabled] = useState(false);

  const handle3DToggle = () => {
    const newState = !is3DEnabled;
    setIs3DEnabled(newState);
    on3DToggle?.(newState);
  };

  return (
    <div className="rounded-xl shadow-2xl p-3 w-80" style={{ backgroundColor: '#333333' }}>
      <div className="space-y-1">
        {/* 3D Generation Option */}
        <button
          onClick={handle3DToggle}
          className={(() => {
            const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
            const activeClass = 'bg-white/20 backdrop-blur-md text-white';
            const inactiveClass = 'text-white/80 hover:text-white hover:bg-white/10';
            const shimmerClass = !is3DEnabled ? '3d-shimmer' : '';
            return `${baseClass} ${is3DEnabled ? activeClass : inactiveClass} ${shimmerClass}`;
          })()}
          disabled={disabled}
        >
          <span>3D</span>
          {is3DEnabled ? (
            <div className="w-4 h-4 rounded-full bg-white border-2 border-white/30"></div>
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-white/30"></div>
          )}
        </button>
        
        {/* Unreal Reflection™ preset options */}
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange?.(preset.id)}
            className={(() => {
              const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
              const activeClass = 'bg-white/20 backdrop-blur-md text-white';
              const inactiveClass = 'text-white/80 hover:text-white hover:bg-white/10';
              return `${baseClass} ${value === preset.id ? activeClass : inactiveClass}`;
            })()}
          >
            <span>{preset.label}</span>
            {value === preset.id ? (
              <div className="w-4 h-4 rounded-full bg-white border-2 border-white/30"></div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-white/30"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
