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
  return (
    <div className="rounded-xl shadow-2xl p-3 w-80" style={{ backgroundColor: '#333333' }}>
      <div className="space-y-2">
        
        {/* Header */}
        <div className="text-center pb-2 border-b border-gray-600">
          <h3 className="text-white font-semibold text-sm">Parallel Self™</h3>
          <p className="text-gray-400 text-xs mt-1">Not who you are. Who you could've been.</p>
        </div>

        {/* Preset Options */}
        <div className="space-y-1">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange?.(preset.id)}
              disabled={disabled}
              className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                value === preset.id
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="font-medium">{preset.label}</div>
              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                {preset.prompt.substring(0, 100)}...
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-gray-600">
          <p className="text-gray-500 text-xs">
            Select a preset to transform your image
          </p>
        </div>
      </div>
    </div>
  );
}
