// src/hooks/usePresetRunner.ts
import { useRef, useState } from 'react';
import { onPresetClick, onOptionClick } from '../utils/presets/handlers';
import { setCurrentSourceUrl } from '../stores/sourceStore';
export function usePresetRunner() {
    const pendingRef = useRef(null);
    const [busy, setBusy] = useState(false);
    function queuePreset(id) {
        pendingRef.current = { kind: 'preset', id };
    }
    function queueOption(group, key) {
        pendingRef.current = { kind: 'option', group, key };
    }
    async function onSourceReady(srcUrl) {
        // Called after Cloudinary upload succeeds
        // Always set the real Cloudinary URL as the current source, then run
        setCurrentSourceUrl(srcUrl); // <-- critical line
        const task = pendingRef.current;
        pendingRef.current = null;
        if (!task)
            return;
        setBusy(true);
        try {
            if (task.kind === 'preset') {
                await onPresetClick(task.id, srcUrl); // pass srcOverride
            }
            else if (task.kind === 'option') {
                await onOptionClick(task.group, task.key, srcUrl); // pass srcOverride
            }
        }
        catch (error) {
            console.error('Preset runner error:', error);
        }
        finally {
            setBusy(false);
        }
    }
    function clearQueue() {
        pendingRef.current = null;
        setBusy(false);
    }
    return { queuePreset, queueOption, onSourceReady, clearQueue, busy };
}
