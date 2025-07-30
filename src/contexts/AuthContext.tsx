import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { sendOTP as sendOTPService, generateOTP } from '../services/OTPService';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, otp: string) => Promise<boolean>;
  signup: (email: string, name: string, otp: string) => Promise<boolean>;
  logout: () => void;
  sendOTP: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const sendOTP = async (email: string): Promise<boolean> => {
    try {
      // Generate OTP and send via Resend
      const otp = generateOTP();
      
      // Store OTP temporarily for verification (in production, this should be server-side)
      localStorage.setItem('temp-otp', otp);
      localStorage.setItem('temp-email', email);
      
      // Send OTP via our Netlify function
      const result = await sendOTPService(email, otp);
      
      if (result.message.includes('development mode')) {
        toast.success('OTP sent! (Check console for development code)');
      } else {
        toast.success('OTP sent to your email!');
      }
      return true;
    } catch (error) {
      console.error('OTP send error:', error);
      toast.error('Failed to send OTP. Please try again.');
      return false;
    }
  };

  const login = async (email: string, otp: string): Promise<boolean> => {
    try {
      // Verify OTP against stored value
      const storedOTP = localStorage.getItem('temp-otp');
      const storedEmail = localStorage.getItem('temp-email');
      
      if (!storedOTP || !storedEmail || storedEmail !== email) {
        toast.error('Invalid OTP or email. Please request a new OTP.');
        return false;
      }
      
      if (otp === storedOTP) {
        // Clear temporary OTP data
        localStorage.removeItem('temp-otp');
        localStorage.removeItem('temp-email');
        
        const newUser: User = {
          id: Date.now().toString(),
          email,
          name: email.split('@')[0], // Default name from email
        };
        
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        toast.success('Welcome back!');
        return true;
      } else {
        toast.error('Invalid OTP. Please check your email and try again.');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const signup = async (email: string, name: string, otp: string): Promise<boolean> => {
    try {
      // Verify OTP for signup
      const storedOTP = localStorage.getItem('temp-otp');
      const storedEmail = localStorage.getItem('temp-email');
      
      if (!storedOTP || !storedEmail || storedEmail !== email) {
        toast.error('Please request an OTP first.');
        return false;
      }
      
      if (otp !== storedOTP) {
        toast.error('Invalid OTP. Please check your email and try again.');
        return false;
      }
      
      // Clear temporary OTP data
      localStorage.removeItem('temp-otp');
      localStorage.removeItem('temp-email');
      
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      toast.success('Account created successfully!');
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    sendOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};