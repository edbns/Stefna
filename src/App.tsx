import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FloatingAIChat from './components/FloatingAIChat';
import AuthModal from './components/AuthModal';
import AIChat from './components/AIChat';
import LaunchScreen from './components/LaunchScreen';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import CookiesPolicy from './components/CookiesPolicy';
import CookiesConsent, { CookiePreferences } from './components/CookiesConsent';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import { ShortcutsProvider } from './contexts/ShortcutsContext';
import PerformanceMonitor from './components/PerformanceMonitor';
import PageTransition from './components/PageTransition';
import Error404 from './components/Error404';

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
        <Toaster position="top-right" />
      </Router>
    );
  }

  // Render main app
  return (
    <Router>
      {/* Main App */}
      <div className="min-h-screen" style={{ backgroundColor: '#EEEEEE' }}>
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
              <div className="flex h-screen">
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
                <main className={`flex-1 flex flex-col transition-all duration-300 ${
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
                
                {/* Floating AI Chat Button */}
                <FloatingAIChat onClose={() => {}} />
                
                {/* Modals */}
                <AuthModal 
                  isOpen={isAuthModalOpen} 
                  onClose={() => setIsAuthModalOpen(false)} 
                />
                
                <AIChat 
                  isOpen={isAiChatOpen} 
                  onClose={() => setIsAiChatOpen(false)} 
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
        <Toaster position="top-right" />
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
            <AppContent />
            {/* Performance Monitor (Development only) */}
            <PerformanceMonitor />
          </ShortcutsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;