// Advanced Region-Aware Editing Types
// Prevents identity drift through subject locking and per-region control

export type RegionKey = 'subject' | 'background' | 'eyes' | 'mouth' | 'cheeks' | 'hair' | 'custom';

export interface RegionLayer {
  key: RegionKey;
  mask?: string;                // base64 PNG (optional if you generate masks)
  denoise: number;              // 0..1 (aka "strength")
  blend: 'normal'|'screen'|'add'|'overlay'|'soft-light';
}

export interface ControlUnit {
  type: 'ip_face'|'lineart'|'depth'|'pose'|'tile';
  weight: number;               // 0..1
  ref?: string;                 // path to ref image (for ip_face)
}

export interface EditPreset extends ProfessionalPresetConfig {
  subject_lock?: { enabled: boolean; weight: number; ref?: string };
  control?: ControlUnit[];
  applies?: RegionLayer[];      // layered, mask-aware editing
}

// Identity-safe strength ranges
export const IDENTITY_SAFE_RANGES = {
  subject: { min: 0.12, max: 0.22, default: 0.18 },
  background: { min: 0.55, max: 0.80, default: 0.65 },
  effects: { min: 0.24, max: 0.45, default: 0.32 }
} as const;

// Utility function to harden existing presets for identity safety
export function hardenForIdentity<T extends ProfessionalPresetConfig>(p: T): T {
  const SAFE = (x: number) => Math.min(0.22, Math.max(0.12, x));
  return { ...p, strength: SAFE(p.strength ?? 0.18) };
}

// Convert professional preset to background-only grade
export function wrapAsBackgroundGrade(p: ProfessionalPresetConfig): EditPreset {
  return {
    ...p,
    subject_lock: { enabled: true, weight: 0.8 },
    control: [{ type: 'ip_face', weight: 0.8 }],
    applies: [
      { key: 'subject',    denoise: 0.16, blend: 'normal' },
      { key: 'background', denoise: p.strength, blend: 'soft-light' }
    ]
  };
}
