import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from '../utils/motionShim';
import { Users, Gift, Clock, Share2 } from 'lucide-react';
const AIUsageLimitModal = ({ isOpen, onClose, onInviteFriends, usage }) => {
    const resetTime = new Date(usage.resetTime);
    const timeUntilReset = resetTime.getTime() - Date.now();
    const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    const handleShare = () => {
        const shareText = `Join me on Stefna - the AI-powered photo app! Create amazing AI art and get bonus tokens when you sign up with my link.`;
        const shareUrl = window.location.origin;
        if (navigator.share) {
            navigator.share({
                title: 'Join Stefna - AI Photo App',
                text: shareText,
                url: shareUrl
            }).catch(console.error);
        }
        else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
            alert('Invitation link copied to clipboard!');
        }
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6", children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl max-w-md w-full p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Gift, { size: 24, className: "text-white" }) }), _jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: "Daily Limit Reached" }), _jsxs("p", { className: "text-white/60", children: ["You've used ", usage.daily, "/", usage.limit, " AI generations today"] })] }), _jsxs("div", { className: "bg-white/5 border border-white/20 rounded-lg p-4 mb-6", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx(Clock, { size: 20, className: "text-white/60" }), _jsx("span", { className: "text-sm font-medium text-white", children: "Reset in" })] }), _jsxs("div", { className: "text-2xl font-bold text-white", children: [hoursUntilReset, "h ", minutesUntilReset, "m"] }), _jsxs("div", { className: "text-xs text-white/40 mt-1", children: [resetTime.toLocaleDateString(), " at ", resetTime.toLocaleTimeString()] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "font-semibold text-white mb-2", children: "Get More Tokens!" }), _jsx("p", { className: "text-sm text-white/60", children: "Invite friends to Stefna and get +5 bonus tokens for each friend who joins!" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs(motion.button, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: onInviteFriends, className: "w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 bg-white text-black hover:bg-white/90", children: [_jsx(Users, { size: 16 }), _jsx("span", { children: "Invite Friends" })] }), _jsxs(motion.button, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: handleShare, className: "w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 bg-white/5 text-white hover:bg-white/10", children: [_jsx(Share2, { size: 16 }), _jsx("span", { children: "Share App" })] })] }), _jsxs("div", { className: "bg-white/5 border border-white/20 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Gift, { size: 20, className: "text-white" }), _jsx("span", { className: "text-sm font-medium text-white", children: "Bonus Tokens" })] }), _jsx("p", { className: "text-xs text-white/60 mt-1", children: "Each friend gets +5 tokens, you get +5 tokens when they join!" })] })] }), _jsx("div", { className: "text-center mt-6", children: _jsx("button", { onClick: onClose, className: "text-white/60 hover:text-white text-sm", children: "Close" }) })] }) })) }));
};
export default AIUsageLimitModal;
