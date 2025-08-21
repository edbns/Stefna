export const STRENGTH = {
  custom:           { min: 0.12, def: 0.16, max: 0.22 },
  preset:           { min: 0.12, def: 0.16, max: 0.22 },
  emotionmask:      { min: 0.10, def: 0.12, max: 0.15 },
  ghiblireact:      { min: 0.12, def: 0.14, max: 0.18 },
  neotokyoglitch:   { min: 0.20, def: 0.24, max: 0.30 },
  none:             { min: 0.00, def: 0.00, max: 0.00 },
} as const;

export function clampStrength(mode: keyof typeof STRENGTH, value?: number) {
  const p = STRENGTH[mode];
  const v = Number.isFinite(value as number) ? (value as number) : p.def;
  return Math.max(p.min, Math.min(p.max, v));
}
