import React, { useEffect } from 'react'
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

const ComingSoonPage: React.FC = () => {
  // Get referrer email from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const referrerEmail = urlParams.get('ref');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div 
          className="w-32 h-32 mx-auto bg-transparent rounded-xl flex items-center justify-center"
          style={{
            animation: 'wave-shadow 3s ease-in-out infinite',
            background: 'transparent',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain" />
        </div>
        
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes wave-shadow {
              0% { 
                transform: scale(1);
                opacity: 0.4;
                box-shadow: 
                  0 0 0 0 rgba(168, 85, 247, 0.8),
                  0 0 0 0 rgba(236, 72, 153, 0.6),
                  0 0 0 0 rgba(239, 68, 68, 0.4);
              }
              25% { 
                transform: scale(1.05);
                opacity: 0.6;
                box-shadow: 
                  0 0 0 8px rgba(168, 85, 247, 0.4),
                  0 0 0 4px rgba(236, 72, 153, 0.6),
                  0 0 0 0 rgba(239, 68, 68, 0.8);
              }
              50% { 
                transform: scale(1.1);
                opacity: 0.8;
                box-shadow: 
                  0 0 0 16px rgba(168, 85, 247, 0.2),
                  0 0 0 8px rgba(236, 72, 153, 0.4),
                  0 0 0 4px rgba(239, 68, 68, 0.6);
              }
              75% { 
                transform: scale(1.05);
                opacity: 0.6;
                box-shadow: 
                  0 0 0 8px rgba(168, 85, 247, 0.4),
                  0 0 0 16px rgba(236, 72, 153, 0.2),
                  0 0 0 8px rgba(239, 68, 68, 0.4);
              }
              100% { 
                transform: scale(1);
                opacity: 0.4;
                box-shadow: 
                  0 0 0 0 rgba(168, 85, 247, 0.8),
                  0 0 0 0 rgba(236, 72, 153, 0.6),
                  0 0 0 0 rgba(239, 68, 68, 0.4);
              }
            }
          `
        }} />
        
        <div className="mt-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Stefna</h1>
            <p className="text-white/80 text-lg">AI-Powered Photo Transformation Studio</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-white/70 text-sm leading-relaxed">
              Transform your photos with AI magic. From cinematic glow to anime tears and glitchy chaos — 
              Stefna turns any photo into stunning AI art.
            </p>
            
            <div className="space-y-2 text-sm text-white/60">
              <p>✨ Neo Tokyo Glitch effects</p>
              <p>🎭 Ghibli-style reactions</p>
              <p>😊 Emotion mask transformations</p>
              <p>🎨 Custom AI presets</p>
            </div>
          </div>
          
          <div className="pt-4">
            <WaitlistForm referrerEmail={referrerEmail || undefined} />
          </div>
          
          <div className="text-xs text-white/50">
            <p>Powered by Stability.ai, Fal.ai, BFL & more</p>
            <p>Join the waitlist for early access</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const AppContent: React.FC = () => {
  // Set up global error handling
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  // Check if we're on the live domain
  // Only show Coming Soon on the main custom domain, allow testing on Netlify subdomain
  const isLiveDomain = window.location.hostname === 'stefna.xyz'
  
  // 🔍 DEBUG: Log domain detection
  console.log('🔍 App loading on domain:', {
    hostname: window.location.hostname,
    href: window.location.href,
    isLiveDomain,
    isDev: import.meta.env.DEV,
    isNetlifyPreview: window.location.hostname.includes('--'),
    isNetlifySubdomain: window.location.hostname === 'stefna.netlify.app'
  });
  
  // If on live domain, show coming soon page
  if (isLiveDomain) {
    console.log('🚧 Showing Coming Soon page for live domain');
    return <ComingSoonPage />
  }

  console.log('🚀 Loading full app for development/local');
  // For development, always show the full app

  return (
    <div className="min-h-screen bg-black pb-16">
      
      <div>
        <Routes>
          <Route path="/" element={<HomeNew />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/dashboard/management/control" element={<AdminDashboardScreen />} />
          <Route path="/gallery" element={<Navigate to="/" replace />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiesPolicy />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
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