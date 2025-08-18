import { jsx as _jsx } from "react/jsx-runtime";
// src/components/PresetButton.tsx
import { ensureSourceThenRun } from '../state/intentQueue';
import { useSelectedPreset } from '../stores/selectedPreset';
export function PresetButton({ presetId, children, className = '' }) {
    const { setSelectedPreset } = useSelectedPreset();
    async function onClick() {
        console.info('🎯 Preset button clicked:', presetId);
        // Keep UI in sync
        setSelectedPreset(presetId);
        // Close composer with 100ms delay
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('close-composer'));
        }, 100);
        // Use single orchestration point - no direct runs
        await ensureSourceThenRun({ kind: 'preset', presetId: presetId });
    }
    return (_jsx("button", { onClick: onClick, className: `preset-button ${className}`, children: children }));
}
export function TimeMachineButton({ optionKey, children, className = '' }) {
    async function onClick() {
        console.info('🕰️ Time Machine button clicked:', optionKey);
        // Close composer with 100ms delay
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('close-composer'));
        }, 100);
        await ensureSourceThenRun({ kind: 'time_machine', key: optionKey });
    }
    return (_jsx("button", { onClick: onClick, className: `time-machine-button ${className}`, children: children }));
}
export function RestoreButton({ optionKey, children, className = '' }) {
    async function onClick() {
        console.info('🔧 Restore button clicked:', optionKey);
        // Close composer with 100ms delay
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('close-composer'));
        }, 100);
        await ensureSourceThenRun({ kind: 'restore', key: optionKey });
    }
    return (_jsx("button", { onClick: onClick, className: `restore-button ${className}`, children: children }));
}
export function StoryButton({ theme, children, className = '' }) {
    async function onClick() {
        console.info('📖 Story button clicked:', theme);
        // Close composer with 100ms delay
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('close-composer'));
        }, 100);
        await ensureSourceThenRun({ kind: 'story', theme });
    }
    return (_jsx("button", { onClick: onClick, className: `story-button ${className}`, children: children }));
}
