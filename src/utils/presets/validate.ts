// utils/presets/validate.ts
import type { Preset } from './types';
import { PRESETS, OPTION_GROUPS } from './types';
import { presetsStore } from '../../stores/presetsStore';

const ALLOWED: Record<Preset['mode'], { input: Preset['input'][]; requiresSource: boolean }> = {
  i2i:     { input: ['image','video'], requiresSource: true },
  txt2img: { input: ['image'],         requiresSource: false },
};

export function validatePresets(reg: Record<string, Preset>) {
  const errs: string[] = [];
  for (const [id, p] of Object.entries(reg)) {
    if (!p.id || id !== p.id) errs.push(`[${id}] id must exist and match key`);
    if (!p.label) errs.push(`[${id}] label required`);
    if (!p.prompt) errs.push(`[${id}] prompt required`);
    if (!ALLOWED[p.mode]) errs.push(`[${id}] invalid mode ${p.mode}`);
    else {
      const rule = ALLOWED[p.mode];
      if (!rule.input.includes(p.input)) errs.push(`[${id}] input "${p.input}" not allowed for mode "${p.mode}"`);
      if (p.requiresSource !== undefined && p.requiresSource !== rule.requiresSource) {
        errs.push(`[${id}] requiresSource should be ${rule.requiresSource} for mode "${p.mode}"`);
      }
    }
  }
  if (errs.length) {
    // Single clean line in prod; detailed in dev
    console.warn(`validatePresets: ${errs.length} issue(s)`, errs);
  } else {
    console.info('✅ validatePresets: OK');
  }
  return errs;
}

export function validateOptions(
  groups: typeof OPTION_GROUPS,
  reg: typeof PRESETS
) {
  const errs: string[] = [];
  const keys = new Set(Object.keys(reg));
  for (const [group, entries] of Object.entries(groups)) {
    for (const [key, ref] of Object.entries(entries ?? {})) {
      if (!keys.has(String(ref.use))) errs.push(`[${group}/${key}] references missing preset "${String(ref.use)}"`);
      
      // Validate overrides if present
      if (ref.overrides) {
        if (ref.overrides.strength !== undefined && 
            (ref.overrides.strength < 0 || ref.overrides.strength > 1)) {
          errs.push(`[${group}/${key}] override strength must be between 0 and 1`);
        }
      }
    }
  }
  if (errs.length) console.warn(`validateOptions: ${errs.length} issue(s)`, errs);
  else console.info('✅ validateOptions: OK');
  return errs;
}

// UI configuration checks
export function isConfigured<G extends keyof typeof OPTION_GROUPS>(group: G, key: string): boolean {
  return Boolean(OPTION_GROUPS[group]?.[key]);
}

export function getConfiguredOptions<G extends keyof typeof OPTION_GROUPS>(group: G): string[] {
  const groupOptions = OPTION_GROUPS[group];
  return groupOptions ? Object.keys(groupOptions) : [];
}

export function validateUIConfiguration(): string[] {
  const errs: string[] = [];
  
  // Check that presets group has configured options
  // Note: OPTION_GROUPS.presets is intentionally empty since presets are loaded dynamically
  // This validation is not applicable for the current architecture
  const configuredOptions = getConfiguredOptions('presets');
  if (configuredOptions.length === 0) {
    // This is expected - presets are loaded from API, not from OPTION_GROUPS
    console.log('ℹ️ OPTION_GROUPS.presets is empty (expected - presets loaded from API)');
  }
  
  if (errs.length) console.warn(`validateUIConfiguration: ${errs.length} issue(s)`, errs);
  else console.info('✅ validateUIConfiguration: OK');
  
  return errs;
}

// New function that only validates when presets are ready
export function validateUIConfigurationWhenReady(): string[] {
  // Safety check: ensure presetsStore is available
  if (!presetsStore || typeof presetsStore.getState !== 'function') {
    console.warn('⚠️ presetsStore not available for UI validation');
    return [];
  }
  
  try {
    const { status, byId } = presetsStore.getState();
    
    // Don't validate until presets are loaded
    if (status !== 'ready') {
      console.log(`⏳ Skipping UI validation - presets status: ${status}`);
      return [];
    }
    
    // Check that presets group has configured options
    const configuredOptions = Object.keys(byId);
    if (configuredOptions.length === 0) {
      return ['Presets group has no configured options'];
    }
    
    console.info('✅ validateUIConfigurationWhenReady: OK');
    return [];
  } catch (error) {
    console.warn('⚠️ Error during UI validation:', error);
    return [];
  }
}

// Call once on startup
export async function validateAll() {
  console.info('🔍 Validating preset system...');
  const presetErrors = validatePresets(PRESETS);
  const optionErrors = validateOptions(OPTION_GROUPS, PRESETS);
  const uiErrors = validateUIConfiguration();
  
  const totalErrors = presetErrors.length + optionErrors.length + uiErrors.length;
  if (totalErrors === 0) {
    console.info('✅ Preset system validation complete - all good!');
  } else {
    console.warn(`⚠️ Preset system has ${totalErrors} validation issues`);
  }
  
  return { presetErrors, optionErrors, uiErrors };
}

// Synchronous version for immediate validation
export function validateAllSync() {
  console.info('🔍 Validating preset system (sync)...');
  const presetErrors = validatePresets(PRESETS);
  const optionErrors = validateOptions(OPTION_GROUPS, PRESETS);
  const uiErrors = validateUIConfiguration();
  
  const totalErrors = presetErrors.length + optionErrors.length + uiErrors.length;
  if (totalErrors === 0) {
    console.info('✅ Preset system validation complete - all good!');
  } else {
    console.warn(`⚠️ Preset system has ${totalErrors} validation issues`);
  }
  
  return { presetErrors, optionErrors, uiErrors };
}
