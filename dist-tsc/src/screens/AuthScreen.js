import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import authService from '../services/authService';
const AuthScreen = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('email');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Extract referrer email from URL parameters
    const [referrerEmail] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('referrer') || '';
    });
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/.netlify/functions/request-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess('Login code sent to your email!');
                setStep('otp');
            }
            else {
                setError(data.error || 'Failed to send code');
            }
        }
        catch (err) {
            setError('Network error. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/.netlify/functions/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp, referrerEmail: referrerEmail || undefined })
            });
            const data = await response.json();
            if (response.ok) {
                // Store token and user data
                const token = data.token || 'temp-token'; // Handle case where no token is returned
                const user = data.user;
                // Update authService immediately
                authService.setAuthState(token, user);
                setSuccess('Login successful!');
                // Navigate immediately to prevent visual glitches
                navigate('/');
            }
            else {
                setError(data.error || 'Invalid code');
            }
        }
        catch (err) {
            setError('Network error. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleBackToEmail = () => {
        setStep('email');
        setOtp('');
        setError('');
        setSuccess('');
    };
    return (_jsx("div", { className: "min-h-screen bg-black flex items-center justify-center p-6", children: _jsxs("div", { className: "max-w-md w-full", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("img", { src: "/logo.png", alt: "Stefna", className: "w-16 h-16 mx-auto mb-4" }), _jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: step === 'email' ? 'Sign in to Stefna' : 'Enter Login Code' }), _jsx("p", { className: "text-white/60", children: step === 'email'
                                ? 'Enter your email to receive a login code'
                                : `We sent a 6-digit code to ${email}` })] }), referrerEmail && (_jsx("div", { className: "mb-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(CheckCircle, { size: 16, className: "text-green-400" }), _jsxs("span", { className: "text-sm font-medium text-white", children: ["\uD83C\uDF81 You're invited by ", referrerEmail, "! Get 25 bonus credits when you sign up"] })] }) })), _jsxs("div", { className: "bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8", children: [step === 'email' ? (_jsxs("form", { onSubmit: handleRequestOTP, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 16, className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Enter your email", className: "w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10", required: true })] })] }), _jsx("button", { type: "submit", disabled: isLoading || !email, className: `w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${email && !isLoading
                                        ? 'bg-white text-black hover:bg-white/90'
                                        : 'bg-white/10 text-white/40 cursor-not-allowed'}`, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" }), _jsx("span", { children: "Sending..." })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { children: "Get Login Code" }), _jsx(ArrowRight, { size: 16 })] })) })] })) : (_jsxs("form", { onSubmit: handleVerifyOTP, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Login Code" }), _jsx("input", { type: "text", value: otp, onChange: (e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)), placeholder: "Enter 6-digit code", className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 text-center text-lg tracking-widest", maxLength: 6, required: true })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { type: "submit", disabled: isLoading || otp.length !== 6, className: `w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${otp.length === 6 && !isLoading
                                                ? 'bg-white text-black hover:bg-white/90'
                                                : 'bg-white/10 text-white/40 cursor-not-allowed'}`, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" }), _jsx("span", { children: "Verifying..." })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { children: "Sign In" }), _jsx(ArrowRight, { size: 16 })] })) }), _jsxs("button", { type: "button", onClick: handleBackToEmail, disabled: isLoading, className: "w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 bg-white/5 text-white hover:bg-white/10", children: [_jsx(ArrowLeft, { size: 16 }), _jsx("span", { children: "Back to Email" })] })] })] })), error && (_jsxs("div", { className: "mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2", children: [_jsx(XCircle, { size: 16, className: "text-red-400" }), _jsx("span", { className: "text-red-400 text-sm", children: error })] })), success && (_jsxs("div", { className: "mt-4 p-3 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center space-x-2", children: [_jsx(CheckCircle, { size: 16, className: "text-white" }), _jsx("span", { className: "text-white text-sm", children: success })] }))] }), _jsx("div", { className: "text-center mt-6", children: _jsx("button", { onClick: () => navigate('/'), className: "text-white/60 hover:text-white text-sm", children: "\u2190 Back to Home" }) })] }) }));
};
export default AuthScreen;
