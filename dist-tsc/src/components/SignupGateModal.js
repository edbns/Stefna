import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from '../utils/motionShim';
import { X, Sparkles, Heart, Share2, Camera, Lock } from 'lucide-react';
const SignupGateModal = ({ isOpen, onClose, feature }) => {
    const featureConfig = {
        remix: {
            icon: Sparkles,
            title: 'Unlock Remix',
            description: 'Sign up to remix and create your own variations of community creations',
            benefits: ['Try any style', 'Create variations', 'Share your remixes']
        },
        save: {
            icon: Heart,
            title: 'Save Favorites',
            description: 'Sign up to save your favorite creations and build your collection',
            benefits: ['Save favorites', 'Create collections', 'Access anytime']
        },
        share: {
            icon: Share2,
            title: 'Share Creations',
            description: 'Sign up to share your AI creations with the community',
            benefits: ['Share to social', 'Get feedback', 'Build audience']
        },
        upload: {
            icon: Camera,
            title: 'Upload Photos',
            description: 'Sign up to upload your own photos and apply AI filters',
            benefits: ['Upload photos', 'Apply filters', 'Create art']
        },
        ai: {
            icon: Sparkles,
            title: 'Access AI Filters',
            description: 'Sign up to unlock powerful AI filters and transformations',
            benefits: ['AI filters', 'Style mixing', 'High-res output']
        }
    };
    // Get config for the feature, or use a default if feature doesn't exist
    const config = featureConfig[feature] || featureConfig.remix;
    const Icon = config.icon;
    const handleSignup = () => {
        // Close modal and redirect to signup
        onClose();
        // In a real app, this would redirect to the signup flow
        console.log('Redirecting to signup flow...');
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0, y: 20 }, animate: { scale: 1, opacity: 1, y: 0 }, exit: { scale: 0.9, opacity: 0, y: 20 }, className: "bg-[#222222] border border-white/10 rounded-2xl max-w-md w-full p-6 relative shadow-2xl text-white", children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 text-white/60 hover:text-white transition-colors", children: _jsx(X, { size: 24 }) }), _jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "w-16 h-16 bg-white/10 rounded-full flex items-center justify-center", children: _jsx(Icon, { size: 32, className: "text-white" }) }) }), _jsx("h1", { className: "text-xl font-bold text-white mb-2", children: config.title }), _jsx("p", { className: "text-white/60", children: config.description })] }), _jsx("div", { className: "space-y-3 mb-6", children: config.benefits.map((benefit, index) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.1 }, className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(Lock, { size: 12, className: "text-white" }) }), _jsx("span", { className: "text-sm text-white/70", children: benefit })] }, index))) }), _jsxs("div", { className: "space-y-3", children: [_jsx(motion.button, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: handleSignup, className: "w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-white/90 transition-colors", children: "Sign Up Free" }), _jsx(motion.button, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: onClose, className: "w-full bg-white/5 text-white font-semibold py-4 rounded-xl hover:bg-white/10 transition-colors border border-white/20", children: "Continue Browsing" })] }), _jsx("p", { className: "text-center text-xs text-white/40 mt-4", children: "Free to sign up \u2022 No credit card required" })] }) })) }));
};
export default SignupGateModal;
