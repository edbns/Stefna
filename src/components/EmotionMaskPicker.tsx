import React from 'react';
import { EMOTION_MASK_PRESETS, EmotionMaskPreset } from '../presets/emotionmask';

interface EmotionMaskPickerProps {
  presets?: EmotionMaskPreset[];
  value?: string;
  onChange?: (id: string) => void;
  disabled?: boolean;
}

export function EmotionMaskPicker({
  presets = EMOTION_MASK_PRESETS,
  value,
  onChange,
  disabled = false,
}: EmotionMaskPickerProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-3 w-80">
      <div className="space-y-1">
        {/* None option - matches other dropdowns exactly */}
        <button
          onClick={() => onChange?.('')}
          className={(() => {
            const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
            const activeClass = 'bg-gray-100 text-gray-900';
            const inactiveClass = 'text-gray-700 hover:text-gray-900 hover:bg-gray-50';
            return `${baseClass} ${!value ? activeClass : inactiveClass}`;
          })()}
        >
          <span>None</span>
          {!value && (
            <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-gray-300"></div>
          )}
        </button>
        
        {/* Emotion Mask preset options - matches other dropdowns exactly */}
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange?.(preset.id)}
            className={(() => {
              const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
              const activeClass = 'bg-gray-100 text-gray-900';
              const inactiveClass = 'text-gray-700 hover:text-gray-900 hover:bg-gray-50';
              return `${baseClass} ${value === preset.id ? activeClass : inactiveClass}`;
            })()}
          >
            <span>{preset.label}</span>
            {value === preset.id ? (
              <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-gray-300"></div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
