import React from 'react'
import { createDevAuth, clearDevAuth, getTestUser, canUseDevAuth } from '../utils/devAuth'
import authService from '../services/authService'

const DevAuthButton: React.FC = () => {
  // Only show in development mode
  if (!canUseDevAuth()) {
    return null
  }

  const isAuthenticated = authService.isAuthenticated()
  const testUser = getTestUser()

  const handleLogin = () => {
    const success = createDevAuth()
    if (success) {
      // Trigger auth state change event
      window.dispatchEvent(new CustomEvent('auth-state-changed'))
      console.log('✅ Dev login successful!')
    } else {
      console.error('❌ Dev login failed!')
    }
  }

  const handleLogout = () => {
    clearDevAuth()
    // Trigger auth state change event
    window.dispatchEvent(new CustomEvent('auth-state-changed'))
    console.log('✅ Dev logout successful!')
  }

  return (
    <div className="fixed top-4 left-4 z-[999999] bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3">
      <div className="text-white text-xs mb-2 font-bold">DEV AUTH</div>
      
      {isAuthenticated ? (
        <div className="space-y-2">
          <div className="text-green-400 text-xs">
            ✅ Logged in as: {testUser.email}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-gray-400 text-xs">
            Not logged in
          </div>
          <button
            onClick={handleLogin}
            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors"
          >
            Login as Test User
          </button>
        </div>
      )}
    </div>
  )
}

export default DevAuthButton
