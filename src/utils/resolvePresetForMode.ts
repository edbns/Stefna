export function resolvePresetForMode({ mode, option, activeRotation = [] }: {
  mode: 'time_machine'|'story'|'restore',
  option?: string,
  activeRotation?: string[]
}) {
  if (mode === 'time_machine') {
    const map: Record<string,string> = {
      '1920s_noir_glam': 'noir_classic',
      '1960s_kodachrome': 'vintage_film_35mm',
      '1980s_vhs_retro': 'retro_polaroid',
      '1990s_disposable': 'vintage_film_35mm',
      '2100_cyberpunk': 'neon_nights',
    };
    return map[option || ''] || 'noir_classic';
  }

  if (mode === 'story') {
    const themeMap: Record<string,string[]> = {
      auto: (activeRotation.length ? activeRotation : [
        'cinematic_glow','bright_airy','vivid_pop','vintage_film_35mm','tropical_boost','urban_grit'
      ]),
      seasons: ['dreamy_pastels','sun_kissed','moody_forest','frost_light'],
      daypart: ['golden_hour_magic','crystal_clear','cinematic_glow','neon_nights'],
      mood: ['bright_airy','vivid_pop','urban_grit','dreamy_pastels'],
      art: ['crystal_clear','vintage_film_35mm','dreamy_pastels','neon_nights'],
    };
    const pick = (arr: string[]) => arr[Math.floor(Math.random()*arr.length)];
    const key = (option || 'auto').toLowerCase();
    const pool = themeMap[key] || themeMap.auto;
    return pick(pool);
  }

  if (mode === 'restore') {
    const map: Record<string,string> = {
      'colorize_bw': 'crystal_clear',
      'revive_faded': 'vivid_pop',
      'sharpen_enhance': 'crystal_clear',
      'remove_scratches': 'crystal_clear'
    };
    return map[option || ''] || 'crystal_clear';
  }

  return 'crystal_clear';
}