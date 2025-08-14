import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppErrorBoundary } from './components/AppErrorBoundary'

// Loud errors
window.addEventListener('error', e => console.error('[window.onerror]', e.error || e.message));
window.addEventListener('unhandledrejection', e => console.error('[unhandledrejection]', e.reason));

// Constructor diagnostic - catches the actual failing new calls
(function () {
  const orig = Reflect.construct;
  Reflect.construct = function (Target, args, NewTarget) {
    try {
      return orig(Target, args, NewTarget);
    } catch (e) {
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
})();

// Loud fetch
(() => {
  const orig = window.fetch;
  window.fetch = async (input: RequestInfo, init?: RequestInit) => {
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