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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(12px)',
      background: 'rgba(0, 0, 0, 0.5)',
      padding: '2rem',
      borderRadius: '16px',
      maxWidth: '400px',
      width: '90%',
      margin: '0 auto'
    }}>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            borderRadius: '8px',
            border: 'none',
            marginBottom: '1rem',
            backgroundColor: 'white',
            color: 'black'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            border: 'none',
            borderRadius: '8px',
            background: 'white',
            color: 'black',
            fontWeight: '500',
            cursor: isLoading || !email.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !email.trim() ? 0.5 : 1
          }}
        >
          {isLoading ? 'Joining...' : 'Join the Waitlist'}
        </button>
      </form>

      {message && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          backgroundColor: isSuccess ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: isSuccess ? '#4ade80' : '#f87171',
          border: `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          width: '100%',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {referrerEmail && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.8)',
          width: '100%'
        }}>
          You were invited by {referrerEmail}! 🎉
        </div>
      )}
    </div>
  );
};

export default WaitlistForm;
