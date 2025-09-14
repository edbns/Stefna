import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import authService from '../services/authService'
import WaitlistForm from '../components/WaitlistForm'

const AuthScreen: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [quotaReached, setQuotaReached] = useState(false)
  
  // Extract referrer email from URL parameters
  const [referrerEmail] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('referrer') || ''
  })

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('') // Clear any previous success message

    try {
      // First check if quota allows this user to sign up
      const quotaResponse = await fetch('/.netlify/functions/check-quota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const quotaData = await quotaResponse.json()

      if (!quotaData.success) {
        setError('Unable to check quota. Please try again.')
        return
      }

      if (!quotaData.canSignUp) {
        setError('Beta quota reached. Please join our waitlist for the next batch.')
        setQuotaReached(true)
        return
      }

      // If quota check passes, proceed with OTP request
      const response = await fetch('/.netlify/functions/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Login code sent to your email!')
        setStep('otp')
      } else {
        setError(data.error || 'Failed to send code')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleVerifyOTPAuto(otp)
  }

  const handleVerifyOTPAuto = async (otpValue: string) => {
    if (!otpValue || otpValue.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('') // Clear any previous success message

    try {
      const response = await fetch('/.netlify/functions/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code: otpValue, referrerEmail: referrerEmail || undefined })
      })

      const data = await response.json()

      if (response.ok) {
        // Store token and user data
        const accessToken = data.accessToken || data.token || 'temp-token' // Handle both new and old format
        const refreshToken = data.refreshToken // New refresh token
        const user = data.user
        
        // Update authService immediately
        authService.setAuthState(accessToken, user, refreshToken)
        
        setSuccess('Login successful!')
        // Navigate immediately to prevent visual glitches
        navigate('/')
      } else {
        setError(data.error || 'Invalid code')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp('')
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Stefna" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === 'email' ? 'Sign in to Stefna' : 'Enter Login Code'}
          </h1>
          <p className="text-white/60">
            {step === 'email' 
              ? 'Enter your email to receive a login code'
              : `We sent a 6-digit code to ${email}`
            }
          </p>
        </div>

        {/* Referral Bonus Indicator */}
        {referrerEmail && (
          <div className="mb-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm font-medium text-white">
                🎁 You're invited by {referrerEmail}! Get 25 bonus credits when you sign up
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8">
          {step === 'email' ? (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                  email && !isLoading
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Get Login Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Login Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const newOtp = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(newOtp)
                    
                    // Clear any previous error/success messages when typing
                    if (newOtp.length > 0) {
                      setError('')
                      setSuccess('')
                    }
                    
                    // Auto-verify when 6 digits are entered
                    if (newOtp.length === 6 && !isLoading) {
                      // Small delay to ensure state is updated
                      setTimeout(() => {
                        handleVerifyOTPAuto(newOtp)
                      }, 100)
                    }
                  }}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className={`w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                    otp.length === 6 && !isLoading
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToEmail}
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 bg-white/5 text-white hover:bg-white/10"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Email</span>
                </button>
              </div>
            </form>
          )}

          {/* Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle size={16} className="text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
              {quotaReached && (
                <button
                  onClick={() => setShowWaitlistModal(true)}
                  className="w-full py-2 px-4 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Join Waitlist
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center space-x-2">
              <CheckCircle size={16} className="text-white" />
              <span className="text-white text-sm">{success}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-white/60 hover:text-white text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-white/20 rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowWaitlistModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-xl"
            >
              ×
            </button>
            <WaitlistForm 
              referrerEmail={referrerEmail}
              onSuccess={() => {
                setShowWaitlistModal(false)
                navigate('/')
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthScreen 