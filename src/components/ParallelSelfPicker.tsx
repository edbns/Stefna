import React from 'react';
import { PARALLEL_SELF_PRESETS, ParallelSelfPreset } from '../presets/parallelSelf';

interface ParallelSelfPickerProps {
  presets?: ParallelSelfPreset[];
  value?: string;
  onChange?: (id: string) => void;
  disabled?: boolean;
}

export function ParallelSelfPicker({
  presets = PARALLEL_SELF_PRESETS,
  value,
  onChange,
  disabled = false,
}: ParallelSelfPickerProps) {
  // User-friendly descriptions for hover cards
  const presetDescriptions: Record<string, string> = {
    'Rain Dancer': 'Cinematic storm, soaked elegance, emotional power.',
    'The Untouchable': 'Grayscale icon, sharp style, cold gaze.',
    'Holiday Mirage': 'Golden hour glow, vacation fantasy, effortless chic.',
    'Who Got Away': 'Leaving the gala, cinematic heartbreak, paparazzi lights.',
    'Nightshade': 'Black-on-black power in a glowing white space, minimal and futuristic.',
    'Afterglow': 'Disco shimmer, gold and silver highlights, soft cinematic focus.'
  }

  return (
    <div className="rounded-xl shadow-2xl p-3 w-80" style={{ backgroundColor: '#333333' }}>
      <div className="space-y-2">
        
        {/* Parallel Self™ preset options */}
        {presets.map((preset) => (
          <div key={preset.id} className="relative group">
            <button
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
            
            {/* Hover card with description */}
            <div className="absolute z-10 hidden group-hover:flex bg-white/90 backdrop-blur-md text-black text-xs p-3 rounded-lg shadow-lg w-64 top-1/2 left-full ml-2 transform -translate-y-1/2">
              <div className="text-center">
                <div className="text-xs leading-relaxed">
                  {presetDescriptions[preset.label]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
