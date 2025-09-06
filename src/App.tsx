import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toasts'
import { ProfileProvider } from './contexts/ProfileContext'
// StickyFooter removed per new minimal UI
import SignupGateModal from './components/SignupGateModal'
import HomeNew from './components/HomeNew'
import PrivacyPolicy from './screens/PrivacyPolicy'
import TermsOfService from './screens/TermsOfService'
import CookiesPolicy from './screens/CookiesPolicy'
import ProfileScreen from './screens/ProfileScreen'
import AdminDashboardScreen from './screens/AdminDashboardScreen'
import { Navigate } from 'react-router-dom'
import AuthScreen from './screens/AuthScreen'
import { initializeAuthBootstrap } from './services/authBootstrap'
import { setupGlobalErrorHandling } from './utils/globalErrorHandler'
import WaitlistForm from './components/WaitlistForm'
import { useIsMobile } from './hooks/useResponsive'

const ComingSoonPage: React.FC = () => {
  // Get referrer email from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const referrerEmail = urlParams.get('ref');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div className="w-16 h-16 mx-auto mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
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

const MobileRestrictedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div className="w-16 h-16 mx-auto mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">Mobile App Coming Soon</h1>
        <p className="text-gray-300 mb-6">
          For the best experience, please visit our website on desktop or wait for our mobile app release.
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            View Gallery
          </button>
          <p className="text-sm text-gray-400">
            Mobile app features coming soon
          </p>
        </div>
      </div>
    </div>
  )
}

const AppContent: React.FC = () => {
  const [isLaunched, setIsLaunched] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  // Set up global error handling
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  // Check launch status
  useEffect(() => {
    const checkLaunchStatus = async () => {
      try {
        const response = await fetch('/.netlify/functions/get-launch-status');
        const data = await response.json();
        
        if (data.success) {
          setIsLaunched(data.launch.is_launched);
        } else {
          console.error('Failed to get launch status:', data.error);
          setIsLaunched(false); // Default to not launched
        }
      } catch (error) {
        console.error('Error checking launch status:', error);
        setIsLaunched(false); // Default to not launched
      } finally {
        setIsLoading(false);
      }
    };

    checkLaunchStatus();
  }, []);

  // Check if we're on the live domain
  const isLiveDomain = window.location.hostname === 'stefna.xyz'
  
  // 🔍 DEBUG: Log domain detection
  console.log('🔍 App loading on domain:', {
    hostname: window.location.hostname,
    href: window.location.href,
    isLiveDomain,
    isLaunched,
    isLoading,
    isDev: import.meta.env.DEV,
    isNetlifyPreview: window.location.hostname.includes('--'),
    isNetlifySubdomain: window.location.hostname === 'stefna.netlify.app'
  });
  
  // Show loading while checking launch status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  // If on live domain and not launched, show coming soon page
  if (isLiveDomain && !isLaunched) {
    console.log('🚧 Showing Coming Soon page for live domain (not launched)');
    return <ComingSoonPage />
  }

  console.log('🚀 Loading full app');
  // Show full app for development or if launched

  return (
    <div className="min-h-screen bg-black pb-16">
      
      <div>
        <Routes>
          {/* Home route - always accessible */}
          <Route path="/" element={<HomeNew />} />
          
          {/* Mobile restrictions - show restricted page for non-home routes */}
          {isMobile ? (
            <>
              <Route path="/auth" element={<MobileRestrictedPage />} />
              <Route path="/profile" element={<MobileRestrictedPage />} />
              <Route path="/dashboard/management/control" element={<MobileRestrictedPage />} />
              <Route path="/gallery" element={<Navigate to="/" replace />} />
              <Route path="/privacy" element={<MobileRestrictedPage />} />
              <Route path="/terms" element={<MobileRestrictedPage />} />
              <Route path="/cookies" element={<MobileRestrictedPage />} />
              <Route path="/coming-soon" element={<ComingSoonPage />} />
            </>
          ) : (
            <>
              {/* Desktop routes - full access */}
              <Route path="/auth" element={<AuthScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/dashboard/management/control" element={<AdminDashboardScreen />} />
              <Route path="/gallery" element={<Navigate to="/" replace />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiesPolicy />} />
              <Route path="/coming-soon" element={<ComingSoonPage />} />
            </>
          )}
        </Routes>
      </div>

      {/* Footer removed per new UI */}

      {/* Signup Gate Modal */}
      <SignupGateModal
        isOpen={false}
        onClose={() => {}}
        feature=""
      />
    </div>
  )
}

const App: React.FC = () => {
  useEffect(() => {
    // Initialize auth bootstrap on app start
    initializeAuthBootstrap();
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <ProfileProvider>
          <AppContent />
        </ProfileProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App 