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
    <div className="rounded-xl shadow-2xl p-3 w-80" style={{ backgroundColor: '#333333' }}>
      <div className="space-y-1">
        {/* Emotion Mask preset options - including the None option from presets */}
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
