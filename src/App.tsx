import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import LaunchScreen from './components/LaunchScreen';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import CookiesPolicy from './components/CookiesPolicy';
import CookiesConsent, { CookiePreferences } from './components/CookiesConsent';
// import './App.css'; // Removed - using Tailwind CSS instead
import ErrorBoundary from './components/ErrorBoundary';
import { ShortcutsProvider } from './contexts/ShortcutsContext';
import { TrendingProvider } from './contexts/TrendingContext';
import PerformanceMonitor from './components/PerformanceMonitor';
import PageTransition from './components/PageTransition';
import Error404 from './components/Error404';

// Environment variable checking for debugging
const checkEnvironmentVariables = () => {
  if (import.meta.env.DEV) {
    console.log('🔍 Environment Variables Status:');
    console.log('================================');
    
    const requiredVars = [
      'VITE_OPENROUTER_API_KEY',
      'VITE_HUGGINGFACE_API_KEY',
      'VITE_DEEPINFRA_API_KEY',
      'VITE_TOGETHER_API_KEY',
      'VITE_REPLICATE_API_KEY',
      'VITE_GROQ_API_KEY',
      'VITE_YOUTUBE_API_KEY',
      'VITE_NEWSDATA_API_KEY',
      'VITE_LASTFM_API_KEY',
      'VITE_REDDIT_CLIENT_ID',
      'VITE_REDDIT_CLIENT_SECRET',
      'VITE_RESEND_API_KEY'
    ];
    
    const results = requiredVars.map(variable => {
      const value = import.meta.env[variable];
      const exists = !!value;
      return { variable, exists, value: exists ? `${value.substring(0, 8)}...` : undefined };
    });
    
    const missing = results.filter(r => !r.exists);
    const present = results.filter(r => r.exists);
    
    console.log(`✅ Present: ${present.length}/${results.length}`);
    present.forEach(result => {
      console.log(`  ${result.variable}: ${result.value}`);
    });
    
    if (missing.length > 0) {
      console.log(`❌ Missing: ${missing.length}/${results.length}`);
      missing.forEach(result => {
        console.log(`  Missing ${result.variable}`);
      });
      
      console.log('\n📝 To fix missing variables:');
      console.log('1. Create a .env file in the root directory');
      console.log('2. Add the missing variables with your API keys');
      console.log('3. For Netlify deployment, add them in the dashboard');
      console.log('4. Restart your development server');
    }
    
    console.log('================================');
  }
};

// Check environment variables on app start
checkEnvironmentVariables();

// Main App Content
const AppContent: React.FC = () => {
  // All hooks must be called in the same order every render
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(false);

  // Check for existing consent on component mount
  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      setHasConsented(true);
    } else {
      // Show consent banner after launch screen
      if (!showLaunchScreen) {
        setShowConsentBanner(true);
      }
    }
  }, [showLaunchScreen]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAuthModalOpen = () => {
    setIsAuthModalOpen(true);
  };

  const handleAiChatOpen = () => {
    setIsAiChatOpen(true);
  };

  const handleLaunchComplete = () => {
    setShowLaunchScreen(false);
  };

  const handleConsentAccept = (preferences: CookiePreferences) => {
    localStorage.setItem('cookies-consent', JSON.stringify(preferences));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setHasConsented(true);
    setShowConsentBanner(false);
  };

  const handleConsentDecline = () => {
    const minimalPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem('cookies-consent', JSON.stringify(minimalPreferences));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setHasConsented(true);
    setShowConsentBanner(false);
  };

  // Render launch screen
  if (showLaunchScreen) {
    return (
      <Router>
        <LaunchScreen onComplete={handleLaunchComplete} />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #333333',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            },
            success: {
              style: {
                background: '#000000',
                color: '#ffffff',
              },
            },
            error: {
              style: {
                background: '#000000',
                color: '#ffffff',
              },
            },
          }}
        />
      </Router>
    );
  }

  // Render main app
  return (
    <Router>
      {/* Main App */}
      <div className="min-h-screen bg-white">
        <Routes>
          {/* Legal Documents Routes */}
          <Route 
            path="/privacy-policy" 
            element={
              <PageTransition key="privacy-policy">
                <PrivacyPolicy />
              </PageTransition>
            } 
          />
          <Route 
            path="/terms-and-conditions" 
            element={
              <PageTransition key="terms-and-conditions">
                <TermsAndConditions />
              </PageTransition>
            } 
          />
          <Route 
            path="/cookies-policy" 
            element={
              <PageTransition key="cookies-policy">
                <CookiesPolicy />
              </PageTransition>
            } 
          />
          
          {/* Main App Route */}
          <Route 
            path="/*" 
            element={
              <div className="flex h-screen bg-white">
                {/* Sidebar */}
                <Sidebar
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                  onToggle={handleSidebarToggle}
                  selectedPlatform={selectedPlatform}
                  onPlatformChange={setSelectedPlatform}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  onAuthOpen={handleAuthModalOpen}
                />
                
                {/* Main Content */}
                <main className={`flex-1 flex flex-col bg-white ${
                  isSidebarOpen ? 'ml-64' : 'ml-28'
                }`}>
                  <Routes>
                    <Route 
                      path="/" 
                      element={
                        <PageTransition key="dashboard">
                          <Dashboard
                            onSidebarToggle={handleSidebarToggle}
                            onAiChatOpen={handleAiChatOpen}
                            onAuthOpen={handleAuthModalOpen}
                            selectedPlatform={selectedPlatform}
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                          />
                        </PageTransition>
                      } 
                    />
                    <Route 
                      path="*" 
                      element={<Error404 />} 
                    />
                  </Routes>
                </main>
                

                
                {/* Modals */}
                <AuthModal 
                  isOpen={isAuthModalOpen} 
                  onClose={() => setIsAuthModalOpen(false)} 
                />
                

              </div>
            }
          />
        </Routes>
        
        {/* Cookies Consent Banner */}
        {showConsentBanner && (
          <CookiesConsent 
            onAccept={handleConsentAccept}
            onDecline={handleConsentDecline}
          />
        )}
        
        {/* Toast Notifications */}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #333333',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            },
            success: {
              style: {
                background: '#000000',
                color: '#ffffff',
              },
            },
            error: {
              style: {
                background: '#000000',
                color: '#ffffff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <ShortcutsProvider>
            <TrendingProvider>
              <AppContent />
              {/* Performance Monitor (Development only) */}
              <PerformanceMonitor />
            </TrendingProvider>
          </ShortcutsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;