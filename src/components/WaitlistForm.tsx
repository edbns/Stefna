// src/components/WaitlistForm.tsx
import React, { useState } from 'react';

interface WaitlistFormProps {
  referrerEmail?: string;
}

const WaitlistForm: React.FC<WaitlistFormProps> = ({ referrerEmail }) => {
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
            disabled={isLoading}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full bg-white text-black py-3 px-6 rounded-lg font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Joining...' : 'Join the Waitlist'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          isSuccess 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message}
        </div>
      )}

      {referrerEmail && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg text-center">
          <p className="text-white/80 text-sm">
            You were invited by {referrerEmail}! 🎉
          </p>
        </div>
      )}
    </div>
  );
};

export default WaitlistForm;
