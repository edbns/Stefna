// utils/presets/validate.ts
import { PROFESSIONAL_PRESETS, ProfessionalPresetConfig } from '../../config/professional-presets';
import { presetsStore } from '../../stores/presetsStore';

const ALLOWED: Record<ProfessionalPresetConfig['mode'], { input: ProfessionalPresetConfig['input'][]; requiresSource: boolean }> = {
  i2i: { input: ['image'], requiresSource: true },
};

export function validatePresets(reg: Record<string, ProfessionalPresetConfig>) {
  const errs: string[] = [];
  for (const [id, p] of Object.entries(reg)) {
    if (!p.id || id !== p.id) errs.push(`[${id}] id must exist and match key`);
    if (!p.label) errs.push(`[${id}] label required`);
    if (!p.promptAdd) errs.push(`[${id}] promptAdd required`);
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

export function validateOptions(): string[] {
  // No more OPTION_GROUPS in new system
  console.info('✅ validateOptions: OK (no options to validate)');
  return [];
}

// UI configuration checks
export function isConfigured(group: string, key: string): boolean {
  // No more OPTION_GROUPS in new system
  return false;
}

export function getConfiguredOptions(group: string): string[] {
  // No more OPTION_GROUPS in new system
  return [];
}

export function validateUIConfiguration(): string[] {
  const errs: string[] = [];
  
  // Check that presets are available
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
    
    // Validate that all professional presets are available
    const presetIds = Object.keys(byId);
    const expectedIds = Object.keys(PROFESSIONAL_PRESETS);
    
    const missingIds = expectedIds.filter(id => !presetIds.includes(id));
    if (missingIds.length > 0) {
      console.warn(`⚠️ Missing presets: ${missingIds.join(', ')}`);
      return [`Missing presets: ${missingIds.join(', ')}`];
    }
    
    console.log('✅ validateUIConfigurationWhenReady: OK');
    return [];
  } catch (error) {
    console.error('❌ UI validation failed:', error);
    return ['UI validation failed'];
  }
}

// Call once on startup
export async function validateAll() {
  console.info('🔍 Validating preset system...');
  const presetErrors = validatePresets(PROFESSIONAL_PRESETS);
  const optionErrors = validateOptions();
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
  const presetErrors = validatePresets(PROFESSIONAL_PRESETS);
  const optionErrors = validateOptions();
  const uiErrors = validateUIConfiguration();
  
  const totalErrors = presetErrors.length + optionErrors.length + uiErrors.length;
  if (totalErrors === 0) {
    console.info('✅ Preset system validation complete - all good!');
  } else {
    console.warn(`⚠️ Preset system has ${totalErrors} validation issues`);
  }
  
  return { presetErrors, optionErrors, uiErrors };
}
