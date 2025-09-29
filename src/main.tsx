import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
// import { validateAllSync, validateAll, validateUIConfigurationWhenReady } from './utils/presets/validate' // REMOVED - using database-driven presets now
// import { presetsStore } from './stores/presetsStore' // REMOVED - using database-driven presets now

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
// if (!presetsStore) { // REMOVED - using database-driven presets now
//   console.error('❌ presetsStore import failed');
// }

// Extend Window interface for development helpers
declare global {
  interface Window {
    testSaveMedia?: () => Promise<void>
  }
}

// Load presets store first, then validate
// setTimeout(async () => { // REMOVED - using database-driven presets now
//   try {
//     // Ensure store is initialized before accessing
//     if (presetsStore && typeof presetsStore.getState === 'function') {
//       await presetsStore.getState().load();
//       // Now validate UI configuration when presets are ready
//       validateUIConfigurationWhenReady();
//     } else {
//       console.warn('⚠️ presetsStore not ready yet, retrying...');
//       // Retry after a short delay
//       setTimeout(() => {
//         if (presetsStore && typeof presetsStore.getState === 'function') {
//           presetsStore.getState().load().then(() => {
//             validateUIConfigurationWhenReady();
//           }).catch(console.error);
//         }
//       }, 100);
//     }
//   } catch (error) {
//     console.error('❌ Failed to initialize presets store:', error);
//   }
// }, 0);

// Validate preset system on startup (sync for immediate feedback)
// validateAllSync() // REMOVED - using database-driven presets now

// Async validation for story themes
// validateAll().catch(console.error) // REMOVED - using database-driven presets now

// Development mode - all old test functions removed
if (import.meta.env.DEV) {
  console.log('🔧 Development mode: All generation now uses dedicated functions');
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
    const url = typeof input === 'string' ? input : input.toString();
    
    // Skip logging for known blocked URLs (analytics, tracking, etc.)
    const isBlockedUrl = url.includes('rum') || 
                        url.includes('analytics') || 
                        url.includes('tracking') || 
                        url.includes('telemetry') ||
                        url.includes('metrics');
    
    if (!isBlockedUrl) {
      console.info('[fetch>]', id, url, init?.method || 'GET');
    }
    
    try {
      const res = await orig(input, init);
      if (!isBlockedUrl) {
        console.info('[fetch<]', id, res.status, res.url);
      }
      return res;
    } catch (err: any) {
      // Check if this is a blocked request error
      const errorMsg = String(err?.message || err || '');
      const isBlockedError = errorMsg.includes('ERR_BLOCKED_BY_CLIENT') || 
                            errorMsg.includes('Failed to fetch') ||
                            errorMsg.includes('net::ERR_BLOCKED_BY_CLIENT');
      
      if (isBlockedError) {
        // Silently handle blocked requests - don't log them
        if (!isBlockedUrl) {
          console.debug('[fetch!]', id, 'Request blocked by client (ad blocker)');
        }
        // Return a mock response to prevent unhandled rejections
        return new Response(JSON.stringify({ 
          error: 'Request blocked by client',
          blocked: true 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Log actual errors that aren't blocked
        if (!isBlockedUrl) {
          console.error('[fetch!]', id, err);
        }
        throw err;
      }
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
    <HelmetProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
)

console.log('✅ React app render call completed'); 