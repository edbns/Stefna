// src/components/WaitlistForm.tsx
import React, { useState } from 'react';

interface WaitlistFormProps {
  referrerEmail?: string;
  onSuccess?: () => void;
}

const WaitlistForm: React.FC<WaitlistFormProps> = ({ referrerEmail, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/.netlify/functions/waitlist-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          referrerEmail: referrerEmail
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setIsSuccess(true);
        setEmail('');
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500); // Small delay to show success message
        }
      } else {
        setMessage(data.error || 'Something went wrong. Please try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Waitlist signup error:', error);
      setMessage('Network error. Please check your connection and try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Join the Waitlist</h2>
        <p className="text-gray-400 text-sm">Get notified when spots open up</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={isLoading}
          className="w-full px-4 py-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            email.trim() && !isLoading
              ? 'bg-white text-black hover:bg-gray-100'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm text-center ${
          isSuccess 
            ? 'bg-gray-800 text-white border border-gray-600' 
            : 'bg-red-900/20 text-red-400 border border-red-500/20'
        }`}>
          {message}
        </div>
      )}

      {referrerEmail && (
        <div className="mt-4 p-3 bg-gray-800 border border-gray-600 rounded-lg text-center">
          <p className="text-gray-300 text-sm">
            You were invited by <span className="text-white font-medium">{referrerEmail}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default WaitlistForm;
