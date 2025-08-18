import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toasts';
import { ProfileProvider } from './contexts/ProfileContext';
// StickyFooter removed per new minimal UI
import SignupGateModal from './components/SignupGateModal';
import HomeNew from './components/HomeNew';
import PrivacyPolicy from './screens/PrivacyPolicy';
import TermsOfService from './screens/TermsOfService';
import CookiesPolicy from './screens/CookiesPolicy';
import ProfileScreen from './screens/ProfileScreen';
import { Navigate } from 'react-router-dom';
import AuthScreen from './screens/AuthScreen';
import { initializeAuthBootstrap } from './services/authBootstrap';
import { setupGlobalErrorHandling } from './utils/globalErrorHandler';
const ComingSoonPage = () => {
    return (_jsx("div", { className: "min-h-screen bg-black flex items-center justify-center", children: _jsxs("div", { className: "text-center max-w-md p-8", children: [_jsx("div", { className: "w-32 h-32 mx-auto bg-transparent rounded-xl flex items-center justify-center", style: {
                        animation: 'wave-shadow 3s ease-in-out infinite',
                        background: 'transparent',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }, children: _jsx("img", { src: "/logo.png", alt: "Logo", className: "w-24 h-24 object-contain" }) }), _jsx("style", { dangerouslySetInnerHTML: {
                        __html: `
            @keyframes wave-shadow {
              0% { 
                transform: scale(1);
                opacity: 0.4;
                box-shadow: 
                  0 0 0 0 rgba(168, 85, 247, 0.8),
                  0 0 0 0 rgba(236, 72, 153, 0.6),
                  0 0 0 0 rgba(239, 68, 68, 0.4);
              }
              25% { 
                transform: scale(1.05);
                opacity: 0.6;
                box-shadow: 
                  0 0 0 8px rgba(168, 85, 247, 0.4),
                  0 0 0 4px rgba(236, 72, 153, 0.6),
                  0 0 0 0 rgba(239, 68, 68, 0.8);
              }
              50% { 
                transform: scale(1.1);
                opacity: 0.8;
                box-shadow: 
                  0 0 0 16px rgba(168, 85, 247, 0.2),
                  0 0 0 8px rgba(236, 72, 153, 0.4),
                  0 0 0 4px rgba(239, 68, 68, 0.6);
              }
              75% { 
                transform: scale(1.05);
                opacity: 0.6;
                box-shadow: 
                  0 0 0 8px rgba(168, 85, 247, 0.4),
                  0 0 0 16px rgba(236, 72, 153, 0.2),
                  0 0 0 8px rgba(239, 68, 68, 0.4);
              }
              100% { 
                transform: scale(1);
                opacity: 0.4;
                box-shadow: 
                  0 0 0 0 rgba(168, 85, 247, 0.8),
                  0 0 0 0 rgba(236, 72, 153, 0.6),
                  0 0 0 0 rgba(239, 68, 68, 0.4);
              }
            }
          `
                    } })] }) }));
};
const AppContent = () => {
    // Set up global error handling
    useEffect(() => {
        setupGlobalErrorHandling();
    }, []);
    // Check if we're on the live domain
    const isLiveDomain = window.location.hostname === 'stefna.xyz' || window.location.hostname === 'stefna.netlify.app';
    // If on live domain, show coming soon page
    if (isLiveDomain) {
        return _jsx(ComingSoonPage, {});
    }
    // For development, always show the full app
    return (_jsxs("div", { className: "min-h-screen bg-black pb-16", children: [_jsx("div", { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomeNew, {}) }), _jsx(Route, { path: "/auth", element: _jsx(AuthScreen, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProfileScreen, {}) }), _jsx(Route, { path: "/gallery", element: _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "/privacy", element: _jsx(PrivacyPolicy, {}) }), _jsx(Route, { path: "/terms", element: _jsx(TermsOfService, {}) }), _jsx(Route, { path: "/cookies", element: _jsx(CookiesPolicy, {}) }), _jsx(Route, { path: "/coming-soon", element: _jsx(ComingSoonPage, {}) })] }) }), _jsx(SignupGateModal, { isOpen: false, onClose: () => { }, feature: "" })] }));
};
const App = () => {
    useEffect(() => {
        // Initialize auth bootstrap on app start
        initializeAuthBootstrap();
    }, []);
    return (_jsx(BrowserRouter, { children: _jsx(ToastProvider, { children: _jsx(ProfileProvider, { children: _jsx(AppContent, {}) }) }) }));
};
export default App;
