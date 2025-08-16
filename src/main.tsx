import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { validateAllSync, validateAll } from './utils/presets/validate'
import { PRESETS } from './utils/presets/types'

// Sanity check: ensure preset keys match preset.id
for (const [key, preset] of Object.entries(PRESETS)) {
  if (key !== preset.id) {
    console.warn(`⚠️ Preset key/id mismatch: ${key} !== ${preset.id}`);
  }
}

// Validate preset system on startup (sync for immediate feedback)
validateAllSync()

// Async validation for story themes
validateAll().catch(console.error)

// Import test in development
if (import.meta.env.DEV) {
  import('./utils/presets/test')
  // Run system tests
  import('./utils/presets/test-system').then(({ logTestResults }) => {
    logTestResults();
  }).catch(console.error);
}
import { AppErrorBoundary } from './components/AppErrorBoundary'

// Loud errors
window.addEventListener('error', e => console.error('[window.onerror]', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e.reason || '');
  if (msg.includes('ERR_BLOCKED_BY_CLIENT')) return; // ignore analytics blocks
  console.error('[unhandledrejection]', e.reason);
});

// Constructor diagnostic - DEV ONLY (removed from production)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const orig = Reflect.construct;
  Reflect.construct = function (Target: any, args: any, NewTarget: any) {
    try {
      return orig(Target, args, NewTarget);
    } catch (e: any) {
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
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const id = crypto.randomUUID?.() ?? String(Date.now());
    console.info('[fetch>]', id, typeof input === 'string' ? input : input.toString(), init?.method || 'GET');
    try {
      const res = await orig(input, init);
      console.info('[fetch<]', id, res.status, res.url);
      return res;
    } catch (err) {
      console.error('[fetch!]', id, err);
      throw err;
    }
  };
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
) 