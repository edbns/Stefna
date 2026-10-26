import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import LabApp from './LabApp'
import './index.css'

// Preserve the existing private app, but load it only on its own routes.
const LegacyApp = lazy(() => import('./App'))
const privateRoutes = new Set(['/login', '/auth', '/profile', '/dashboard/management/control'])
const privateRoute = privateRoutes.has(window.location.pathname.replace(/\/+$/, '').toLowerCase())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <AppErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white" role="status">Loading Stefna…</div>}>
          {privateRoute ? <LegacyApp /> : <LabApp />}
        </Suspense>
      </AppErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
)
