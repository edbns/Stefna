import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

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
  signup: (email: string, name: string) => Promise<boolean>;
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
      // Simulate API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would call your backend API here
      // await fetch('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) });
      
      toast.success('OTP sent to your email!');
      return true;
    } catch (error) {
      toast.error('Failed to send OTP');
      return false;
    }
  };

  const login = async (email: string, otp: string): Promise<boolean> => {
    try {
      // Simulate API call to verify OTP and login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any 6-digit OTP
      if (otp.length === 6 && /^\d{6}$/.test(otp)) {
        // In a real implementation, you would verify the OTP with your backend
        // const response = await fetch('/api/auth/verify-login', { 
        //   method: 'POST', 
        //   body: JSON.stringify({ email, otp }) 
        // });
        
        const newUser: User = {
          id: Date.now().toString(),
          email,
          name: email.split('@')[0], // Default name from email
          // Removed default avatar generation
        };
        
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        toast.success('Welcome back!');
        return true;
      } else {
        toast.error('Invalid OTP. Please enter a 6-digit code.');
        return false;
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const signup = async (email: string, name: string): Promise<boolean> => {
    try {
      // Simulate API call to create account
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would create the account with your backend
      // const response = await fetch('/api/auth/signup', { 
      //   method: 'POST', 
      //   body: JSON.stringify({ email, name }) 
      // });
      
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        // Removed default avatar generation
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      toast.success('Account created successfully!');
      return true;
    } catch (error) {
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