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
      {/* None option - matches presets exactly */}
      <button
        onClick={() => onChange?.('')}
        className={(() => {
          const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
          const activeClass = 'bg-white/20 text-white';
          const inactiveClass = 'text-white/80 hover:text-white hover:bg-white/10';
          return `${baseClass} ${!value ? activeClass : inactiveClass}`;
        })()}
      >
        <span>None</span>
        {!value && (
          <div className="w-4 h-4 rounded-full bg-white border-2 border-white/30"></div>
        )}
      </button>
      
      {/* Emotion Mask preset options - matches presets exactly */}
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onChange?.(preset.id)}
          className={(() => {
            const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
            const activeClass = 'bg-white/20 text-white';
            const inactiveClass = 'text-white/80 hover:text-white hover:bg-white/10';
            return `${baseClass} ${value === preset.id ? activeClass : inactiveClass}`;
          })()}
        >
          <div className="text-left">
            <div className="font-medium">{preset.label}</div>
            <div className="text-xs text-white/60">{preset.description}</div>
          </div>
          {value === preset.id ? (
            <div className="w-4 h-4 rounded-full bg-white border-2 border-white/30"></div>
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-white/30"></div>
          )}
        </button>
      ))}
    </div>
  );
}
