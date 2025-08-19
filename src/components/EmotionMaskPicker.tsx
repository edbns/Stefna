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
    <div className="space-y-1">
      {/* None option - gentle pastel styling */}
      <button
        onClick={() => onChange?.('')}
        className={(() => {
          const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300 text-sm';
          const activeClass = 'bg-rose-100/20 text-rose-200 border border-rose-200/30 shadow-sm';
          const inactiveClass = 'text-rose-100/80 hover:text-rose-200 hover:bg-rose-100/10 border border-transparent hover:border-rose-200/20';
          return `${baseClass} ${!value ? activeClass : inactiveClass}`;
        })()}
      >
        <span className="font-medium">None</span>
        {!value && (
          <div className="w-4 h-4 rounded-full bg-rose-200 border-2 border-rose-300/50 shadow-sm"></div>
        )}
      </button>
      
      {/* Emotion Mask preset options - gentle pastel styling */}
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onChange?.(preset.id)}
          className={(() => {
            const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300 text-sm';
            const activeClass = 'bg-rose-100/20 text-rose-200 border border-rose-200/30 shadow-sm';
            const inactiveClass = 'text-rose-100/80 hover:text-rose-200 hover:bg-rose-100/10 border border-transparent hover:border-rose-200/20';
            return `${baseClass} ${value === preset.id ? activeClass : inactiveClass}`;
          })()}
        >
          <span className="font-medium">{preset.label}</span>
          {value === preset.id ? (
            <div className="w-4 h-4 rounded-full bg-rose-200 border-2 border-rose-300/50 shadow-sm"></div>
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-rose-200/30"></div>
          )}
        </button>
      ))}
    </div>
  );
}
