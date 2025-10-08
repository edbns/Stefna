import React from 'react';
import { UNREAL_REFLECTION_PRESETS } from '../presets/unrealReflection';
import { PARALLEL_SELF_PRESETS } from '../presets/parallelSelf';

interface CombinedPresetPickerProps {
  value?: string;
  onChange?: (id: string, type: 'unreal' | 'parallel') => void;
  disabled?: boolean;
}

export function CombinedPresetPicker({
  value,
  onChange,
  disabled = false,
}: CombinedPresetPickerProps) {
  // Combine all presets from both modes
  const allPresets = [
    ...UNREAL_REFLECTION_PRESETS.map(preset => ({
      ...preset,
      type: 'unreal' as const
    })),
    ...PARALLEL_SELF_PRESETS.map(preset => ({
      ...preset,
      type: 'parallel' as const
    }))
  ];

  // Image mapping for presets based on best practices
  const getPresetImage = (presetLabel: string): string => {
    const imageMap: Record<string, string> = {
      'Black Aura': '/images/parallel_self_black_aura.webp',
      'The Untouchable': '/images/parallel_self_untouchable.webp',
      'Neon Proof': '/images/parallel_self_neon_proof.webp',
      'The Mechanic': '/images/parallel_self_the_mechanic.webp',
      'Colorcore': '/images/parallel_self_colorcore.webp',
      'Getaway Lookbook': '/images/parallel_self_getaway_lookbook.webp',
      'The Syndicate': '/images/unreal_reflection_the_syndicate.webp',
      'Yakuza Heir': '/images/unreal_reflection_yakuza_heir.webp',
      'The Gothic Pact': '/images/unreal_reflection_gothic_pact.webp',
      'Y2K Paparazzi': '/images/unreal_reflection_Y2K_Paparazzi.webp',
      'Medusa\'s Mirror': '/images/unreal_reflection_medusa_mirror.webp',
      'Chromatic Bloom': '/images/unreal_reflection_chromatic_bloom.webp'
    };
    
    return imageMap[presetLabel] || '/images/placeholder.webp';
  };

  return (
    <div className="rounded-xl shadow-2xl p-3 w-full" style={{ backgroundColor: '#000000' }}>
      <div className="grid grid-cols-2 gap-2 pb-4">
        {allPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange?.(preset.id, preset.type)}
            className={(() => {
              const baseClass = 'relative overflow-hidden rounded-lg transition-all duration-200 group';
              const activeClass = 'ring-2 ring-white scale-105';
              const inactiveClass = 'hover:scale-102 hover:ring-1 hover:ring-white/50';
              return `${baseClass} ${value === preset.id ? activeClass : inactiveClass}`;
            })()}
            disabled={disabled}
          >
            <div className="aspect-square relative">
              <img
                src={getPresetImage(preset.label)}
                alt={preset.label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to a gradient if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-1.5">
                <h3 className="text-white text-xs font-medium text-center leading-tight">
                  {preset.label}
                </h3>
              </div>
              {value === preset.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-black/30"></div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}