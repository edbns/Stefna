import React, { useState } from 'react';
import { X, Mail, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp-login' | 'otp-signup'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, signup, sendOTP } = useAuth();

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({ email: '', name: '', otp: '' });
  };

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  const handleBackToForm = () => {
    if (mode === 'otp-login') {
      setMode('login');
    } else if (mode === 'otp-signup') {
      setMode('signup');
    }
    setFormData(prev => ({ ...prev, otp: '' }));
  };

  const isOTPMode = mode === 'otp-login' || mode === 'otp-signup';
  const isSignupMode = mode === 'signup' || mode === 'otp-signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        // Send OTP for login
        const success = await sendOTP(formData.email);
        if (success) {
          setMode('otp-login');
        }
      } else if (mode === 'signup') {
        // Send OTP for signup
        const success = await sendOTP(formData.email);
        if (success) {
          setMode('otp-signup');
        }
      } else if (mode === 'otp-login') {
        // Verify OTP and login
        const success = await login(formData.email, formData.otp);
        if (success) {
          onClose();
          setFormData({ email: '', name: '', otp: '' });
        }
      } else if (mode === 'otp-signup') {
        // Verify OTP and create account
        const success = await signup(formData.email, formData.name, formData.otp);
        if (success) {
          onClose();
          setFormData({ email: '', name: '', otp: '' });
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Verify OTP'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {mode === 'login' 
                ? 'Sign in to access enhanced features' 
                : mode === 'signup' 
                ? 'Join thousands of content creators' 
                : 'Enter the OTP sent to your phone'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field - only for signup */}
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            )}

            {/* Email field - for login and signup */}
            {!isOTPMode && (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            )}

            {/* OTP field - for OTP verification */}
            {isOTPMode && (
              <div className="relative">
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  value={formData.otp}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-button hover:bg-button-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 
                isOTPMode ? 'Verify OTP' :
                'Send OTP'
              }
            </button>
          </form>

          {/* Mode switching - only show when not in OTP mode */}
          {!isOTPMode && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                {isSignupMode ? "Already have an account?" : "Don't have an account?"}
                <button
                  onClick={() => handleModeSwitch(isSignupMode ? 'login' : 'signup')}
                  className="ml-2 text-button hover:text-button-hover font-semibold transition-colors"
                >
                  {isSignupMode ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          )}

          {/* Back button - only show in OTP mode */}
          {isOTPMode && (
            <div className="mt-6 text-center">
              <button
                onClick={handleBackToForm}
                className="text-button hover:text-button-hover font-semibold transition-colors"
              >
                ← Back to {isSignupMode ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;