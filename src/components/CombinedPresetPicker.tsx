import React from 'react';
import { UNREAL_REFLECTION_PRESETS } from '../presets/unrealReflection';
import { PARALLEL_SELF_PRESETS } from '../presets/parallelSelf';

interface CombinedPresetPickerProps {
  value?: string;
  onChange?: (id: string, type: 'unreal' | 'parallel') => void;
  disabled?: boolean;
  isDesktop?: boolean;
}

export function CombinedPresetPicker({
  value,
  onChange,
  disabled = false,
  isDesktop = false,
}: CombinedPresetPickerProps) {
  // Prioritize latest 7 presets first (as per user requirement)
  // Latest order: 1. Tides Ceremony, 2. Molten Halo, 3. Iron Bloom, 4. Velvet Trap, 5. Venom Ceremony, 6. Airport Fashion, 7. Reflection Pact
  const latestPresetIds = [
    'unreal_reflection_tides_ceremony',
    'unreal_reflection_molten_halo',
    'unreal_reflection_iron_bloom',
    'unreal_reflection_velvet_trap',
    'unreal_reflection_venom_ceremony', 
    'unreal_reflection_airport_fashion',
    'unreal_reflection_reflection_pact'
  ];
  
  // Separate presets into categories
  const deprioritizedOrder = ['Blueberry Bliss', 'Medusa\'s Mirror'];
  
  // Extract latest presets (in the exact order specified)
  const latestPresets = latestPresetIds
    .map(id => UNREAL_REFLECTION_PRESETS.find(p => p.id === id))
    .filter(Boolean)
    .map(preset => ({ ...preset!, type: 'unreal' as const }));
  
  // Get all other unreal presets (excluding latest 4 and deprioritized)
  const otherUnrealPresets = UNREAL_REFLECTION_PRESETS
    .filter(p => !latestPresetIds.includes(p.id) && !deprioritizedOrder.includes(p.label))
    .map(preset => ({ ...preset, type: 'unreal' as const }));
  
  // Deprioritized unreal presets
  const unrealDeprioritized = UNREAL_REFLECTION_PRESETS
    .filter(p => deprioritizedOrder.includes(p.label))
    .map(preset => ({ ...preset, type: 'unreal' as const }));
  
  // Parallel Self presets
  const parallelPresets = PARALLEL_SELF_PRESETS.map(preset => ({
    ...preset,
    type: 'parallel' as const
  }));
  
  // Final order: Latest 7 → Other Unreal → Parallel Self → Deprioritized at end
  const allPresets = [
    ...latestPresets,         // Latest 7: Tides Ceremony, Molten Halo, Iron Bloom, Velvet Trap, Venom Ceremony, Airport Fashion, Reflection Pact
    ...otherUnrealPresets,    // All other unreal presets
    ...parallelPresets,       // Parallel Self presets
    ...unrealDeprioritized    // Deprioritized unreal presets at the end
  ];

  // Image mapping for presets based on best practices
  const getPresetImage = (presetLabel: string): string => {
    const imageMap: Record<string, string> = {
      'Tides Ceremony': '/images/unreal_reflection_tides_ceremony.jpg',
      'Molten Halo': '/images/unreal_reflection_molten_halo.jpg',
      'Iron Bloom': '/images/unreal_reflection_iron_bloom.jpg',
      'Reflection Pact': '/images/unreal_reflection_reflection_pact.jpg',
      'Airport Fashion': '/images/unreal_reflection_airport_fashion.jpg',
      'Venom Ceremony': '/images/unreal_reflection_venom_ceremony.jpg',
      'Velvet Trap': '/images/unreal_reflection_velvet_trap.jpg',
      'Tethered Grace': '/images/unreal_reflection_tethered_grace.jpg',
      'Moonfall Ritual': '/images/unreal_reflection_moonfall_ritual.jpg',
      'Obsidian Curve': '/images/unreal_reflection_obsidian_curve.jpg',
      'Untamed Silence': '/images/unreal_reflection_untamed_silence.jpg',
      'Ceramic Bodice': '/images/unreal_reflection_ceramic_bodice.jpg',
      'Red Seat': '/images/unreal_reflection_red_seat.jpg',
      'Desert Vixens': '/images/unreal_reflection_desert_vixens.jpg?v=' + Date.now(),
      'Disco Prisoner': '/images/unreal_reflection_disco_prisoner.jpg',
      'Falcon Ceremony': '/images/unreal_reflection_falcon_ceremony.jpg',
      'Shattered Stone': '/images/unreal_reflection_shattered_stone.jpg',
      'Threadbare Halo': '/images/unreal_reflection_threadbare_halo.jpg',
      'Frozen Bloom': '/images/unreal_reflection_frozen_bloom.jpg',
      'Feather Feral': '/images/unreal_reflection_feather_feral.jpg',
      'Paper Pop': '/images/unreal_reflection_paper_pop.jpg',
      'Red Lipstick': '/images/unreal_reflection_red_lipstick.jpg',
      'Wax Bloom': '/images/unreal_reflection_wax_bloom.jpg',
      'Black Aura': '/images/parallel_self_black_aura.webp',
      'The Untouchable': '/images/parallel_self_untouchable.webp',
      'Neon Proof': '/images/parallel_self_neon_proof.webp',
      'The Mechanic': '/images/parallel_self_the_mechanic.webp',
      'Colorcore': '/images/parallel_self_colorcore.webp',
      'Getaway Lookbook': '/images/parallel_self_getaway_lookbook.webp',
      'Black Bloom': '/images/unreal_reflection_black_bloom.jpg',
      'Yakuza Heir': '/images/unreal_reflection_yakuza_heir.webp',
      'Blueberry Bliss': '/images/unreal_reflection_blueberry_bliss.jpg',
      'Y2K Paparazzi': '/images/unreal_reflection_Y2K_Paparazzi.webp',
      'Medusa\'s Mirror': '/images/unreal_reflection_medusa_mirror.webp',
      'Chromatic Bloom': '/images/unreal_reflection_chromatic_bloom.webp',
      'Chromatic Smoke': '/images/unreal_reflection_chromatic_smoke.jpg',
      'Crystal Fall': '/images/unreal_reflection_Crystal_Fal_.jpg',
      'Butterfly Monarch': '/images/unreal_reflection_Butterfly_Monarch.jpg',
      'Molten Gloss': '/images/unreal_reflection_Molten_Gloss.jpg',
      'Floral Noir': '/images/unreal_reflection_floral_noir.jpg',
      'Chemistry Check': '/images/unreal_reflection_Chemistry_Check.jpg',
      'Wind Layer': '/images/unreal_reflection_wind_layer.jpg?v=' + Date.now(),
      'Mirror Shatter': '/images/unreal_reflection_mirror_shatter.jpg',
    };
    
    return imageMap[presetLabel] || '/images/placeholder.webp';
  };

  return (
    <div className={isDesktop ? 'w-full' : 'w-full'}>
      <div 
        className={`shadow-2xl ${isDesktop ? 'p-6 grid grid-cols-9 gap-4' : 'p-3 grid grid-cols-2 gap-2'}`} 
        style={{ backgroundColor: '#000000' }}
      >
        {allPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange?.(preset.id, preset.type)}
            className={(() => {
              const baseClass = 'relative overflow-hidden transition-all duration-200';
              const activeClass = 'ring-4 ring-white scale-105';
              const inactiveClass = 'hover:scale-105 hover:ring-2 hover:ring-white/50';
              return `${baseClass} ${value === preset.id ? activeClass : inactiveClass}`;
            })()}
            disabled={disabled}
          >
            <div className={`relative ${isDesktop ? 'aspect-[4/5]' : 'aspect-square'}`}>
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
              <div className={`absolute bottom-0 left-0 right-0 ${isDesktop ? 'p-2' : 'p-1.5'}`}>
                <h3 className={`text-white ${isDesktop ? 'text-[9px] font-medium' : 'text-xs font-medium'} text-center leading-tight`}>
                  {preset.label}
                </h3>
              </div>
              {value === preset.id && (
                <div className={`absolute ${isDesktop ? 'top-6 right-6' : 'top-2 right-2'}`}>
                  <div className={`${isDesktop ? 'w-6 h-6' : 'w-3 h-3'} rounded-full bg-white border-2 border-black/30`}></div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}