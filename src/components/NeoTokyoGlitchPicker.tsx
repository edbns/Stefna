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
    <div className={`absolute top-full left-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl p-3 shadow-2xl z-50 min-w-[280px] ${className}`}>
      <div className="text-white/80 text-xs font-medium mb-3 px-2">Choose Your Cyberpunk Style</div>
      
      {/* Neo Tokyo Glitch preset options - matches presets exactly */}
      <div className="space-y-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange(preset.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
              value === preset.id
                ? 'bg-white/20 text-white border border-white/40'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="font-medium">{preset.label}</div>
            <div className="text-xs text-white/60 mt-1">
              {preset.prompt.length > 60 ? `${preset.prompt.substring(0, 60)}...` : preset.prompt}
            </div>
            {preset.features && preset.features.length > 0 && (
              <div className="text-xs text-purple-400 mt-1">
                Features: {preset.features.join(', ')}
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Clear selection option */}
      <button
        onClick={() => onChange(null)}
        className="w-full text-left px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 mt-2 border-t border-white/10 pt-2"
      >
        Clear Selection
      </button>
    </div>
  )
}
