import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import RemixIcon from './RemixIcon';
import authService from '../services/authService';
import { useProfile } from '../contexts/ProfileContext';
const FullScreenMediaViewer = ({ isOpen, media, startIndex = 0, onClose, onRemix, onShowAuth }) => {
    const { profileData } = useProfile();
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const current = useMemo(() => media[currentIndex], [media, currentIndex]);
    // Debug: Log current media data
    useEffect(() => {
        if (current) {
            console.log('🔍 FullScreenMediaViewer current media:', {
                id: current.id,
                prompt: current.prompt,
                userId: current.userId,
                type: current.type,
                hasPrompt: !!current.prompt,
                promptLength: current.prompt?.length || 0
            });
        }
    }, [current]);
    useEffect(() => {
        setCurrentIndex(startIndex);
    }, [startIndex]);
    const handleRemix = () => {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
            if (onShowAuth) {
                onShowAuth();
            }
            else {
                // Fallback: redirect to auth page
                window.location.href = '/auth';
            }
            return;
        }
        if (!onRemix)
            return;
        onRemix(current);
    };
    useEffect(() => {
        if (!isOpen)
            return;
        const handleKey = (e) => {
            if (e.key === 'Escape')
                onClose();
            if (e.key === 'ArrowRight')
                setCurrentIndex((i) => (i + 1) % media.length);
            if (e.key === 'ArrowLeft')
                setCurrentIndex((i) => (i - 1 + media.length) % media.length);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, media.length, onClose]);
    if (!isOpen || !current)
        return null;
    const handlePrev = () => setCurrentIndex((i) => (i - 1 + media.length) % media.length);
    const handleNext = () => setCurrentIndex((i) => (i + 1) % media.length);
    const formattedTime = new Date(current.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    return (_jsxs("div", { className: "fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm", children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white hover:text-white/80 bg-black/50 rounded-full backdrop-blur-sm z-50", "aria-label": "Close viewer", title: "Close", children: _jsx(X, { size: 24 }) }), _jsxs("div", { className: "h-full w-full flex flex-col", children: [_jsx("div", { className: "bg-black/80 backdrop-blur-sm p-4", children: _jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("div", { className: "flex items-center space-x-2 pt-2", children: _jsx("span", { className: "text-white text-sm", children: formattedTime }) }) }) }), _jsxs("div", { className: "flex-1 relative flex flex-col items-center justify-start pt-4", children: [media.length > 1 && (_jsx("button", { onClick: handlePrev, className: "absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white hover:text-white/80", "aria-label": "Previous", title: "Previous", children: _jsx(ChevronLeft, { size: 20 }) })), _jsx("div", { className: "max-w-full max-h-full object-contain", children: current.type === 'video' ? (_jsx("video", { src: current.url, className: "max-w-full max-h-[calc(100vh-200px)] object-contain", controls: true, autoPlay: true, muted: true })) : (_jsx("img", { src: current.url, alt: current.prompt, className: "max-w-full max-h-[calc(100vh-200px)] object-contain" })) }), media.length > 1 && (_jsx("button", { onClick: handleNext, className: "absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white hover:text-white/80", "aria-label": "Next", title: "Next", children: _jsx(ChevronRight, { size: 20 }) })), _jsx("div", { className: "mt-6 text-center max-w-4xl px-4", children: _jsx("div", { className: "flex items-center justify-center", children: _jsx("button", { onClick: handleRemix, className: "w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-105", title: "Remix this creation", "aria-label": "Remix this media", children: _jsx(RemixIcon, { size: 20, className: "text-white" }) }) }) })] })] })] }));
};
export default FullScreenMediaViewer;
