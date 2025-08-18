import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, AlertCircle, Download, Share2 } from 'lucide-react';
import RemixIcon from './RemixIcon';
const GenerationProgress = ({ isVisible, status, result, onComplete, onError, onShareToFeed, onAllowRemix, onSave, onShareSocial }) => {
    const [isImageEnlarged, setIsImageEnlarged] = useState(false);
    const [shareToFeed, setShareToFeed] = useState(false);
    const [allowRemix, setAllowRemix] = useState(false);
    // Load user's saved settings on mount
    useEffect(() => {
        const loadUserSettings = async () => {
            try {
                const savedProfile = localStorage.getItem('userProfile');
                if (savedProfile) {
                    const profile = JSON.parse(savedProfile);
                    setShareToFeed(profile.shareToFeed ?? true); // Default to true
                    setAllowRemix(profile.allowRemix ?? true); // Default to true
                }
            }
            catch (error) {
                console.warn('Failed to load user settings:', error);
                // Use defaults
                setShareToFeed(true);
                setAllowRemix(true);
            }
        };
        loadUserSettings();
    }, []);
    useEffect(() => {
        if (status?.status === 'error') {
            setTimeout(() => {
                onError?.();
            }, 3000);
        }
    }, [status?.status, onError]);
    if (!isVisible || !status)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50", children: _jsx("div", { className: "bg-black/90 backdrop-blur-md rounded-lg p-8 border border-white/20 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "text-center", children: [status.status === 'completed' && result && (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto", children: _jsx(CheckCircle, { size: 32, className: "text-green-400" }) }), _jsx("h3", { className: "text-white text-xl font-semibold", children: "Generation Complete!" }), _jsxs("div", { className: "relative", children: [_jsx("img", { src: result.url, alt: result.prompt, className: `mx-auto rounded-lg border border-white/20 cursor-pointer transition-all duration-300 ${isImageEnlarged ? 'w-full max-w-2xl' : 'w-full max-w-xs'}`, onClick: () => setIsImageEnlarged(!isImageEnlarged) }), _jsx("div", { className: "absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1", children: _jsx("span", { className: "text-white text-sm font-medium", children: isImageEnlarged ? 'Click to shrink' : 'Click to enlarge' }) })] }), _jsxs("div", { className: "text-left bg-white/5 rounded-lg p-4", children: [_jsx("p", { className: "text-white/80 text-base font-medium mb-1", children: "Prompt:" }), _jsx("p", { className: "text-white text-base", children: result.prompt }), result.style && (_jsxs("p", { className: "text-white/60 text-sm mt-1", children: ["Style: ", result.style] }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 mt-6", children: [_jsxs("button", { onClick: async () => {
                                            const newValue = !shareToFeed;
                                            setShareToFeed(newValue);
                                            // Persist to localStorage and database
                                            try {
                                                const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                                                const updatedProfile = { ...currentProfile, shareToFeed: newValue };
                                                localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                                                // Try to update in database if authenticated
                                                const token = localStorage.getItem('auth_token');
                                                if (token) {
                                                    await fetch('/.netlify/functions/user-settings', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Authorization': `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                                        },
                                                        body: JSON.stringify({ shareToFeed: newValue, allowRemix })
                                                    });
                                                }
                                            }
                                            catch (error) {
                                                console.warn('Failed to persist share setting:', error);
                                            }
                                        }, className: `flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-all duration-300 ${shareToFeed
                                            ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                            : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'}`, children: [_jsx(Share2, { size: 18 }), _jsx("span", { className: "text-sm font-medium", children: shareToFeed ? '✓ Share to Feed' : 'Share to Feed' })] }), _jsxs("button", { onClick: async () => {
                                            const newValue = !allowRemix;
                                            setAllowRemix(newValue);
                                            // Persist to localStorage and database
                                            try {
                                                const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                                                const updatedProfile = { ...currentProfile, allowRemix: newValue };
                                                localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                                                // Try to update in database if authenticated
                                                const token = localStorage.getItem('auth_token');
                                                if (token) {
                                                    await fetch('/.netlify/functions/user-settings', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Authorization': `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                                        },
                                                        body: JSON.stringify({ shareToFeed, allowRemix: newValue })
                                                    });
                                                }
                                            }
                                            catch (error) {
                                                console.warn('Failed to persist remix setting:', error);
                                            }
                                        }, className: `flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-all duration-300 ${allowRemix
                                            ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                            : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'}`, children: [_jsx(RemixIcon, { size: 16 }), _jsx("span", { className: "text-sm font-medium", children: allowRemix ? '✓ Allow Remix' : 'Allow Remix' })] }), _jsxs("button", { onClick: () => {
                                            // Apply the selected options when saving
                                            if (shareToFeed)
                                                onShareToFeed?.(result);
                                            if (allowRemix)
                                                onAllowRemix?.(result);
                                            onSave?.(result);
                                        }, className: "flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg border border-white/20 transition-all duration-300", children: [_jsx(Download, { size: 18 }), _jsx("span", { className: "text-sm font-medium", children: "Save & Download" })] }), _jsxs("button", { onClick: () => onShareSocial?.(result), className: "flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg border border-white/20 transition-all duration-300", children: [_jsx(Share2, { size: 18 }), _jsx("span", { className: "text-sm font-medium", children: "Share" })] })] }), _jsx("button", { onClick: onComplete, className: "mt-4 text-white/60 hover:text-white transition-colors duration-300", children: "Close" })] })), status.status === 'error' && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto", children: _jsx(AlertCircle, { size: 32, className: "text-red-400" }) }), _jsx("h3", { className: "text-white text-xl font-semibold", children: "Generation Failed" }), _jsx("p", { className: "text-white/60", children: status.error || 'Something went wrong' })] })), status.status === 'processing' && (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto animate-pulse", children: _jsx(Sparkles, { size: 32, className: "text-white" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-white text-xl font-semibold mb-2", children: "Creating Your AI Art" }), _jsx("p", { className: "text-white/60 text-sm mb-4", children: "This may take a few moments..." }), _jsx("div", { className: "w-full bg-white/10 rounded-full h-3 mb-4", children: _jsx("div", { className: "bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300", style: { width: `${status.progress}%` } }) }), _jsxs("p", { className: "text-white/40 text-sm", children: [Math.round(status.progress), "% complete"] })] })] }))] }) }) }));
};
export default GenerationProgress;
