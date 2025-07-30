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
import ConsentBanner from './components/ConsentBanner';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import { ShortcutsProvider } from './contexts/ShortcutsContext';
import PerformanceMonitor from './components/PerformanceMonitor';
import PageTransition from './components/PageTransition';

// Main App Content
const AppContent: React.FC = () => {
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

  const handleConsentAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setHasConsented(true);
    setShowConsentBanner(false);
  };

  const handleConsentDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setHasConsented(true);
    setShowConsentBanner(false);
  };

  // Show Launch Screen first
  if (showLaunchScreen) {
    return (
      <Router>
        <LaunchScreen onComplete={handleLaunchComplete} />
        <Toaster position="top-right" />
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
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
              <>
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
                <main className={`flex-1 transition-all duration-300 ${
                  isSidebarOpen ? 'ml-64' : 'ml-16'
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
              </>
            }
          />
        </Routes>
        
        {/* Consent Banner */}
        {showConsentBanner && (
          <ConsentBanner 
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

// In your App component
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