import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
// StickyFooter removed per new minimal UI
import SignupGateModal from './components/SignupGateModal'
import WebsiteLayout from './components/WebsiteLayout'
import HomeNew from './components/HomeNew'
import PrivacyPolicy from './screens/PrivacyPolicy'
import TermsOfService from './screens/TermsOfService'
import CookiesPolicy from './screens/CookiesPolicy'
import ProfileScreen from './screens/ProfileScreen'
import { Navigate } from 'react-router-dom'
import AuthScreen from './screens/AuthScreen'

const AppContent: React.FC = () => {
  const location = useLocation()
  
  // Check if we're in development mode
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  // Check if we're on the live domain
  const isLiveDomain = window.location.hostname === 'stefna.xyz' || window.location.hostname === 'stefna.netlify.app'
  
  // If on live domain, redirect to coming soon page if needed
  // For production, you may want to remove this or implement proper domain routing
  // if (isLiveDomain) {
  //   window.location.href = '/coming-soon.html'
  //   return null
  // }
  // Check if we're on profile page to hide footer
  const isProfilePage = location.pathname.startsWith('/profile')

  return (
    <div className="min-h-screen bg-black pb-16">
      <div>
        <Routes>
          <Route path="/" element={<HomeNew />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/gallery" element={<Navigate to="/" replace />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiesPolicy />} />
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
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App 