import React from 'react'
import { NEO_TOKYO_GLITCH_PRESETS, NeoTokyoGlitchPreset } from '../presets/neoTokyoGlitch'

interface NeoTokyoGlitchPickerProps {
  presets?: NeoTokyoGlitchPreset[]
  value?: string | null
  onChange: (presetId: string | null) => void
  className?: string
  disabled?: boolean
}

export function NeoTokyoGlitchPicker({
  presets = NEO_TOKYO_GLITCH_PRESETS,
  value,
  onChange,
  className = ''
}: NeoTokyoGlitchPickerProps) {
  return (
    <div className={`bg-[#333333] border border-white/20 rounded-xl shadow-2xl p-3 w-80 ${className}`}>
      <div className="space-y-1">
        {/* Neo Tokyo Glitch preset options - matches presets exactly */}
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange(preset.id)}
            className={(() => {
              const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
              const activeClass = 'bg-white/20 text-white';
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
  )
}
