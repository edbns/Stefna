import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateAllSync, validateAll, validateUIConfigurationWhenReady } from './utils/presets/validate';
import { PRESETS } from './utils/presets/types';
import { presetsStore } from './stores/presetsStore';
// Sanity check: ensure preset keys match preset.id
for (const [key, preset] of Object.entries(PRESETS)) {
    if (key !== preset.id) {
        console.warn(`⚠️ Preset key/id mismatch: ${key} !== ${preset.id}`);
    }
}
// Load presets store first, then validate
presetsStore.getState().load().then(() => {
    // Now validate UI configuration when presets are ready
    validateUIConfigurationWhenReady();
}).catch(console.error);
// Validate preset system on startup (sync for immediate feedback)
validateAllSync();
// Async validation for story themes
validateAll().catch(console.error);
// Import test in development
if (import.meta.env.DEV) {
    import('./utils/presets/test');
    // Run system tests
    import('./utils/presets/test-system').then(({ logTestResults }) => {
        logTestResults();
    }).catch(console.error);
    // Add debug helper for save-media testing
    window.testSaveMedia = async () => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            console.error('No JWT token found');
            return;
        }
        console.log('🧪 Testing save-media with minimal payload...');
        try {
            const res = await fetch('/.netlify/functions/save-media', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    kind: 'image',
                    url: 'https://picsum.photos/512'
                })
            });
            const text = await res.text();
            console.log(`📡 save-media response: ${res.status} ${res.statusText}`);
            console.log('📄 Response body:', text);
            if (!res.ok) {
                console.error(`❌ save-media failed: ${res.status} ${text}`);
            }
            else {
                console.log('✅ save-media succeeded!');
            }
        }
        catch (error) {
            console.error('🚨 save-media test error:', error);
        }
    };
    console.log('🔧 Development mode: Use window.testSaveMedia() to test save-media endpoint');
}
import { AppErrorBoundary } from './components/AppErrorBoundary';
// Loud errors
window.addEventListener('error', e => console.error('[window.onerror]', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => {
    const msg = String(e.reason || '');
    if (msg.includes('ERR_BLOCKED_BY_CLIENT'))
        return; // ignore analytics blocks
    console.error('[unhandledrejection]', e.reason);
});
// Constructor diagnostic - DEV ONLY (removed from production)
if (import.meta.env.DEV && typeof window !== 'undefined') {
    const orig = Reflect.construct;
    Reflect.construct = function (Target, args, NewTarget) {
        try {
            return orig(Target, args, NewTarget);
        }
        catch (e) {
            console.error('🔧 Reflect.construct failed', {
                targetType: typeof Target,
                targetName: (Target && (Target.name || Target.toString())) || '<unknown>',
                isProxy: !!Target && !!Target.__isProxy,
                error: e.message,
                stack: e.stack
            });
            throw e;
        }
    };
}
// Loud fetch
(() => {
    const orig = window.fetch;
    window.fetch = async (input, init) => {
        const id = crypto.randomUUID?.() ?? String(Date.now());
        console.info('[fetch>]', id, typeof input === 'string' ? input : input.toString(), init?.method || 'GET');
        try {
            const res = await orig(input, init);
            console.info('[fetch<]', id, res.status, res.url);
            return res;
        }
        catch (err) {
            console.error('[fetch!]', id, err);
            throw err;
        }
    };
})();
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(AppErrorBoundary, { children: _jsx(App, {}) }) }));
