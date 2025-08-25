import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { validateAllSync, validateAll, validateUIConfigurationWhenReady } from './utils/presets/validate'
import { presetsStore } from './stores/presetsStore'

// 🔍 IMMEDIATE DEBUG: Verify bundle execution
window.addEventListener('error', e => console.error('[window.onerror]', e.error || e.message));
window.addEventListener('unhandledrejection', e => console.error('[unhandledrejection]', e.reason));
console.info('[boot] main loaded', { mode: import.meta.env.MODE, href: location.href });

// 🔍 DEBUG: Immediate logging to verify script execution
console.log('🚀 main.tsx starting...');
console.log('🔍 Environment:', {
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
});

// 📊 Performance monitoring with web-vitals
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

// Safety check: ensure presetsStore is properly imported
if (!presetsStore) {
  console.error('❌ presetsStore import failed');
}

// Extend Window interface for development helpers
declare global {
  interface Window {
    testSaveMedia?: () => Promise<void>
  }
}

// Load presets store first, then validate
setTimeout(async () => {
  try {
    // Ensure store is initialized before accessing
    if (presetsStore && typeof presetsStore.getState === 'function') {
      await presetsStore.getState().load();
      // Now validate UI configuration when presets are ready
      validateUIConfigurationWhenReady();
    } else {
      console.warn('⚠️ presetsStore not ready yet, retrying...');
      // Retry after a short delay
      setTimeout(() => {
        if (presetsStore && typeof presetsStore.getState === 'function') {
          presetsStore.getState().load().then(() => {
            validateUIConfigurationWhenReady();
          }).catch(console.error);
        }
      }, 100);
    }
  } catch (error) {
    console.error('❌ Failed to initialize presets store:', error);
  }
}, 0);

// Validate preset system on startup (sync for immediate feedback)
validateAllSync()

// Async validation for story themes
validateAll().catch(console.error)

// Import test in development - REMOVED: old test files no longer exist
if (import.meta.env.DEV) {
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
      } else {
        console.log('✅ save-media succeeded!');
      }
    } catch (error) {
      console.error('🚨 save-media test error:', error);
    }
  };
  
  console.log('🔧 Development mode: Use window.testSaveMedia() to test save-media endpoint');
}
import { AppErrorBoundary } from './components/AppErrorBoundary'

// Loud errors
window.addEventListener('error', e => console.error('[window.onerror]', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e.reason || '');
  if (msg.includes('ERR_BLOCKED_BY_CLIENT') || 
      msg.includes('rum_collection') || 
      msg.includes('Failed to fetch')) return; // ignore analytics/ad-blocker noise
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

// 📊 Performance monitoring - track Core Web Vitals
onCLS(console.log);
onFCP(console.log);
onINP(console.log);
onLCP(console.log);
onTTFB(console.log);

console.log('🔍 About to render React app...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)

console.log('✅ React app render call completed'); 