import React from 'react'
import { GHIBLI_REACTION_PRESETS } from '../presets/ghibliReact'
// import { MinimalPreset } from '../utils/presets/aimlUtils' // REMOVED - drama file deleted

interface GhibliReactionPickerProps {
  presets?: any[] // MinimalPreset removed - drama type deleted
  value?: string | null
  onChange: (presetId: string | null) => void
  className?: string
  disabled?: boolean
}

export function GhibliReactionPicker({
  presets = GHIBLI_REACTION_PRESETS,
  value,
  onChange,
  className = ''
}: GhibliReactionPickerProps) {
  return (
    <div className={`rounded-xl shadow-2xl p-3 w-80 ${className}`} style={{ backgroundColor: '#000000' }}>
      <div className="space-y-1">
        {/* Ghibli Reaction preset options - matches presets exactly */}
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange(preset.id)}
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
  )
}
