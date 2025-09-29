import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toasts'
import { ProfileProvider } from './contexts/ProfileContext'
// StickyFooter removed per new minimal UI
import SignupGateModal from './components/SignupGateModal'
import HomeNew from './components/HomeNew'
import PrivacyPolicy from './screens/PrivacyPolicy'
import TermsOfService from './screens/TermsOfService'
import CookiesPolicy from './screens/CookiesPolicy'
import ProfileScreen from './screens/ProfileScreen'
import MobileGalleryScreen from './screens/MobileGalleryScreen'
import AdminDashboardScreen from './screens/AdminDashboardScreen'
import StoryCreationScreen from './screens/StoryCreationScreen'
import StoryScreen from './screens/StoryScreen'
import IndividualStoryScreen from './screens/IndividualStoryScreen'
import { Navigate } from 'react-router-dom'
import AuthScreen from './screens/AuthScreen'
import BestPracticesScreen from './screens/BestPracticesScreen'
import TagPageScreen from './screens/TagPageScreen'
import { initializeAuthBootstrap } from './services/authBootstrap'
import { setupGlobalErrorHandling } from './utils/globalErrorHandler'
import WaitlistForm from './components/WaitlistForm'
import { useIsMobile } from './hooks/useResponsive'
import LoadingSpinner from './components/LoadingSpinner'
import MobileRouteGuard from './components/MobileRouteGuard'

// Scroll to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

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
        
        // Handle blocked requests (e.g., by robots.txt or crawlers)
        if (!response.ok) {
          console.warn('Launch status request blocked or failed, defaulting to launched');
          setIsLaunched(true); // Default to launched for better UX
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setIsLaunched(data.launch.is_launched);
        } else {
          console.error('Failed to get launch status:', data.error);
          setIsLaunched(true); // Default to launched for better UX
        }
      } catch (error) {
        console.warn('Error checking launch status (likely blocked by crawler):', error);
        setIsLaunched(true); // Default to launched for better UX
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
        <LoadingSpinner size="lg" text="Loading Stefna..." />
      </div>
    );
  }
  
  // If on live domain and not launched, show coming soon page
  // But allow dashboard access for admin
  if (isLiveDomain && !isLaunched) {
    console.log('🚧 Showing Coming Soon page for live domain (not launched)');
    
    // Check if user is trying to access dashboard
    const currentPath = window.location.pathname;
    if (currentPath === '/dashboard/management/control') {
      console.log('🔧 Dashboard access detected, showing full app');
      // Allow dashboard access even when not launched
    } else {
      return <ComingSoonPage />
    }
  }

  console.log('🚀 Loading full app');
  // Show full app for development or if launched

  return (
    <div className="min-h-screen bg-black pb-16">
      
      <div>
        <Routes>
          {/* Home route - always accessible */}
          <Route path="/" element={<HomeNew />} />
          
          {/* Mobile-only routes */}
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/gallery" element={<MobileGalleryScreen />} />
          <Route path="/story" element={<StoryScreen />} />
          <Route path="/story/:slug" element={<IndividualStoryScreen />} />
          
          {/* Desktop-only routes (blocked on mobile) */}
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/dashboard/management/control" element={
            <MobileRouteGuard>
              <AdminDashboardScreen />
            </MobileRouteGuard>
          } />
          <Route path="/StoryCreation" element={
            <MobileRouteGuard>
              <StoryCreationScreen />
            </MobileRouteGuard>
          } />
          <Route path="/privacy" element={
            <MobileRouteGuard>
              <PrivacyPolicy />
            </MobileRouteGuard>
          } />
          <Route path="/terms" element={
            <MobileRouteGuard>
              <TermsOfService />
            </MobileRouteGuard>
          } />
          <Route path="/cookies" element={
            <MobileRouteGuard>
              <CookiesPolicy />
            </MobileRouteGuard>
          } />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          <Route path="/bestpractices" element={<BestPracticesScreen />} />
          <Route path="/tag/:tag" element={<TagPageScreen />} />
          {/* Catch-all route - redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
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