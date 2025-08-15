// utils/presets/integration.ts
// Integration layer to connect new preset system with existing handlers

import { onOptionClick as newOptionClick, onPresetClick as newPresetClick, onStoryClick as newStoryClick } from './handlers';
import { OPTION_GROUPS, isConfigured } from './types';
import { getStoryThemes } from './story';

// Enhanced time machine handler that uses the new system
export async function onTimeMachineClick(option: string, file?: File, sourceUrl?: string): Promise<void> {
  console.log('🕰️ Time machine click:', option);
  
  // Check if option is configured in new system
  if (isConfigured('time_machine', option)) {
    console.log('✅ Using new preset system for:', option);
    await newOptionClick('time_machine', option);
    return;
  }
  
  // Fallback to old system for unconfigured options
  console.warn('⚠️ Option not configured in new system, falling back:', option);
  // Here you could call the old handler or show "coming soon"
  window.dispatchEvent(new CustomEvent('generation-error', { 
    detail: { message: `${option} is not configured yet`, timestamp: Date.now() } 
  }));
}

// Enhanced restore handler
export async function onRestoreClick(option: string): Promise<void> {
  console.log('🔧 Restore click:', option);
  
  if (isConfigured('restore', option)) {
    console.log('✅ Using new preset system for:', option);
    await newOptionClick('restore', option);
    return;
  }
  
  console.warn('⚠️ Restore option not configured:', option);
  window.dispatchEvent(new CustomEvent('generation-error', { 
    detail: { message: `${option} restore is not configured yet`, timestamp: Date.now() } 
  }));
}

// Enhanced story handler
export async function onStoryClick(option: string): Promise<void> {
  console.log('📖 Story click:', option);
  
  // Check if story option is available in story themes
  const storyThemes = getStoryThemes();
  const isStoryTheme = storyThemes.some(theme => theme.key === option);
  
  if (isStoryTheme) {
    console.log('✅ Using new preset system for story:', option);
    await newStoryClick(option);
    return;
  }
  
  console.warn('⚠️ Story option not configured:', option);
  window.dispatchEvent(new CustomEvent('generation-error', { 
    detail: { message: `${option} story mode is not configured yet`, timestamp: Date.now() } 
  }));
}

// Direct preset handler (replaces existing onPresetClick)
export async function onPresetClickIntegrated(presetId: string, file?: File, sourceUrl?: string): Promise<void> {
  console.log('🎨 Preset click (integrated):', presetId);
  
  // Use new system
  await newPresetClick(presetId as any); // Type assertion for now, will be properly typed
}

// Utility to check what options are available
export function getAvailableOptions() {
  const timeMachine = Object.keys(OPTION_GROUPS.time_machine || {});
  const restore = Object.keys(OPTION_GROUPS.restore || {});
  const storyThemes = getStoryThemes();
  const story = storyThemes.map(theme => theme.key);
  
  return {
    time_machine: timeMachine,
    restore,
    story,
    total: timeMachine.length + restore.length + story.length
  };
}

// Debug helper
export function debugPresetSystem() {
  console.group('🔍 Preset System Debug');
  console.log('Available options:', getAvailableOptions());
  console.log('Time machine options:', Object.keys(OPTION_GROUPS.time_machine || {}));
  console.log('Restore options:', Object.keys(OPTION_GROUPS.restore || {}));
  console.log('Story themes:', getStoryThemes().map(t => t.key));
  console.groupEnd();
}
