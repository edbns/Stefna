import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toasts'
import { ProfileProvider } from './contexts/ProfileContext'
import SignupGateModal from './components/SignupGateModal'
import ProfileScreen from './screens/ProfileScreen'
import AuthScreen from './screens/AuthScreen'
import LabScreen from './screens/LabScreen'
import AdminDashboardScreen from './screens/AdminDashboardScreen'
import MobileRouteGuard from './components/MobileRouteGuard'
import { initializeAuthBootstrap } from './services/authBootstrap'
import { setupGlobalErrorHandling } from './utils/globalErrorHandler'
import WaitlistForm from './components/WaitlistForm'
import LoadingSpinner from './components/LoadingSpinner'
import authService from './services/authService'

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

const RootToLab: React.FC = () => {
  const location = useLocation()
  return <Navigate to={{ pathname: '/Lab', search: location.search }} replace />
}

const LegacyAuthToLogin: React.FC = () => {
  const location = useLocation()
  return <Navigate to={{ pathname: '/login', search: location.search }} replace />
}

const ComingSoonPage: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const referrerEmail = urlParams.get('ref')

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div className="w-16 h-16 mx-auto mb-8">
          <img src="/logo-new.png" alt="Logo" className="w-16 h-16 object-contain" />
        </div>

        <div className="mt-8 space-y-6">
          <div className="pt-4">
            <WaitlistForm referrerEmail={referrerEmail || undefined} />
          </div>
        </div>
      </div>
    </div>
  )
}

const AppContent: React.FC = () => {
  const location = useLocation()
  const [isLaunched, setIsLaunched] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setupGlobalErrorHandling()
  }, [])

  useEffect(() => {
    const checkLaunchStatus = async () => {
      try {
        const response = await fetch('/.netlify/functions/get-launch-status')

        if (!response.ok) {
          console.warn('Launch status request blocked or failed, defaulting to launched')
          setIsLaunched(true)
          setIsLoading(false)
          return
        }

        const data = await response.json()

        if (data.success) {
          setIsLaunched(data.launch.is_launched)
        } else {
          console.error('Failed to get launch status:', data.error)
          setIsLaunched(true)
        }
      } catch (error) {
        console.warn('Error checking launch status (likely blocked by crawler):', error)
        setIsLaunched(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkLaunchStatus()
  }, [])

  const isLiveDomain = window.location.hostname === 'stefna.xyz'

  console.log('🔍 App loading on domain:', {
    hostname: window.location.hostname,
    href: window.location.href,
    isLiveDomain,
    isLaunched,
    isLoading,
    isDev: import.meta.env.DEV,
    isNetlifyPreview: window.location.hostname.includes('--'),
    isNetlifySubdomain: window.location.hostname === 'stefna.netlify.app',
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Stefna..." />
      </div>
    )
  }

  const isAdminDashboardPath = location.pathname === '/dashboard/management/control'

  if (isLiveDomain && !isLaunched && !isAdminDashboardPath) {
    console.log('🚧 Showing Coming Soon page for live domain (not launched)')
    return <ComingSoonPage />
  }

  console.log('🚀 Loading full app')

  return (
    <div className="min-h-screen bg-black">
      <div>
        <Routes>
          <Route path="/" element={<RootToLab />} />
          <Route path="/Lab" element={<LabScreen />} />
          <Route path="/lab" element={<Navigate to="/Lab" replace />} />
          <Route path="/login" element={<AuthScreen />} />
          <Route path="/auth" element={<LegacyAuthToLogin />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route
            path="/dashboard/management/control"
            element={
              <MobileRouteGuard>
                <AdminDashboardScreen />
              </MobileRouteGuard>
            }
          />
          <Route path="*" element={<Navigate to="/Lab" replace />} />
        </Routes>
      </div>

      <SignupGateModal isOpen={false} onClose={() => {}} feature="" />
    </div>
  )
}

const App: React.FC = () => {
  useEffect(() => {
    initializeAuthBootstrap()
    authService.handleGoogleCallback()
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastProvider>
        <ProfileProvider>
          <AppContent />
        </ProfileProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
