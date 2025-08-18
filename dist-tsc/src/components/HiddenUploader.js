import { jsx as _jsx } from "react/jsx-runtime";
// src/components/HiddenUploader.tsx
import { useRef, useState } from 'react';
import { handleUploadSelectedFile } from '../lib/upload';
import { useToasts } from './ui/Toasts';
import { useIntentQueue } from '../state/intentQueue';
export function HiddenUploader() {
    const [key, setKey] = useState(0);
    const ref = useRef(null);
    const { addToast } = useToasts();
    const { setSourceUrl } = useIntentQueue();
    async function onChange(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        console.info('📁 File selected:', file.name);
        try {
            addToast('Uploading...', 'info');
            const secureUrl = await handleUploadSelectedFile(file);
            // Call back into the queue on success
            console.info('📁 Upload success, setting source and kicking queue');
            setSourceUrl(secureUrl);
            // Import and kick the queue
            const { kickRunIfReady } = await import('../runner/kick');
            await kickRunIfReady();
        }
        catch (error) {
            console.error('Upload failed:', error);
            addToast('Upload failed. Please try again.', 'error');
        }
        finally {
            // Allow immediate re-select same file without page refresh
            console.info('📁 Resetting file input for next upload');
            setKey((k) => k + 1);
            if (ref.current)
                ref.current.value = '';
        }
    }
    return (_jsx("input", { id: "hidden-file-input", ref: ref, type: "file", accept: "image/*,video/*", hidden: true, onChange: onChange }, key));
}
