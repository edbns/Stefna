import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Zap, Users, Gift } from 'lucide-react';
import tokenService from '../services/tokenService';
import { authenticatedFetch } from '../utils/apiClient';
const ProfileTokenDisplay = ({ userId, className = '' }) => {
    const [usage, setUsage] = useState(null);
    const [serverQuota, setServerQuota] = useState(null);
    const [referralStats, setReferralStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(null);
    useEffect(() => {
        if (import.meta.env.VITE_NO_DB_MODE !== '1') {
            loadTokenData();
            loadServerQuota();
        }
    }, [userId]);
    const loadTokenData = async () => {
        try {
            const userUsage = await tokenService.getInstance().getUserUsage(userId);
            setUsage(userUsage);
            // Get real referral stats from backend instead of tokenService
            try {
                const res = await authenticatedFetch('/.netlify/functions/get-referral-stats', { method: 'GET' });
                if (res.ok) {
                    const stats = await res.json();
                    setReferralStats({
                        invites: stats.invites || 0,
                        tokensEarned: stats.tokensEarned || 0,
                        referralCode: stats.referralCode || `REF_${userId.slice(-6)}`
                    });
                }
                else {
                    // Fallback to tokenService if backend fails
                    const stats = await tokenService.getInstance().getReferralStats(userId);
                    setReferralStats(stats);
                }
            }
            catch (error) {
                console.error('Failed to load referral stats from backend, using fallback:', error);
                const stats = await tokenService.getInstance().getReferralStats(userId);
                setReferralStats(stats);
            }
        }
        catch (error) {
            console.error('Failed to load token data:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const loadServerQuota = async () => {
        try {
            const res = await authenticatedFetch('/.netlify/functions/getQuota', { method: 'GET' });
            if (res.ok) {
                setServerQuota(await res.json());
            }
            else {
                setServerQuota(null);
            }
        }
        catch (e) {
            console.error('Failed to load server quota:', e);
            setServerQuota(null);
        }
    };
    const getUsagePercentage = () => {
        if (!usage)
            return 0;
        return (usage.dailyUsage / usage.dailyLimit) * 100;
    };
    const getUsageColor = () => {
        const percentage = getUsagePercentage();
        if (percentage >= 90)
            return 'text-red-400';
        if (percentage >= 75)
            return 'text-yellow-400';
        return 'text-green-400';
    };
    const getProgressColor = () => {
        const percentage = getUsagePercentage();
        if (percentage >= 90)
            return 'bg-red-400';
        if (percentage >= 75)
            return 'bg-yellow-400';
        return 'bg-green-400';
    };
    const handleCopyReferralCode = async () => {
        if (referralStats?.referralCode) {
            try {
                await navigator.clipboard.writeText(referralStats.referralCode);
                setCopiedCode(referralStats.referralCode);
                setTimeout(() => setCopiedCode(null), 2000);
            }
            catch (error) {
                console.error('Failed to copy referral code:', error);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = referralStats.referralCode;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setCopiedCode(referralStats.referralCode);
                setTimeout(() => setCopiedCode(null), 2000);
            }
        }
    };
    const handleShareInvite = async () => {
        if (referralStats?.referralCode) {
            const shareText = `Join me on Stefna! Use my referral code ${referralStats.referralCode} to get bonus tokens when you sign up. Create amazing AI art at https://stefna.xyz`;
            try {
                if (navigator.share) {
                    await navigator.share({
                        title: 'Join me on Stefna!',
                        text: shareText,
                        url: 'https://stefna.xyz'
                    });
                }
                else {
                    await navigator.clipboard.writeText(shareText);
                    setCopiedCode('shared');
                    setTimeout(() => setCopiedCode(null), 2000);
                }
            }
            catch (error) {
                console.error('Failed to share invite:', error);
            }
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: `bg-[#222222] border border-white/20 rounded-2xl p-6 shadow-2xl ${className}`, children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-6 bg-white/10 rounded mb-4" }), _jsx("div", { className: "h-4 bg-white/10 rounded mb-2" }), _jsx("div", { className: "h-3 bg-white/10 rounded" })] }) }));
    }
    if (!usage) {
        return null;
    }
    const remainingTokens = serverQuota
        ? (serverQuota.daily_limit - serverQuota.daily_used)
        : (usage.dailyLimit - usage.dailyUsage);
    return (_jsxs("div", { className: `bg-[#222222] border border-white/20 rounded-2xl p-6 shadow-2xl ${className}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 bg-white/10 rounded-full flex items-center justify-center", children: _jsx(Zap, { size: 20, className: "text-white" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-semibold text-lg", children: "Token Balance" }), _jsx("p", { className: "text-white/60 text-sm", children: "Standard User \u2022 30 tokens/day" })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: `text-3xl font-bold ${getUsageColor()}`, children: remainingTokens }), _jsx("div", { className: "text-white/60 text-sm", children: "tokens left" })] })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { className: "text-white/60", children: "Daily Usage" }), _jsxs("span", { className: `font-medium ${getUsageColor()}`, children: [serverQuota ? serverQuota.daily_used : usage.dailyUsage, " / ", serverQuota ? serverQuota.daily_limit : usage.dailyLimit] })] }), _jsx("div", { className: "w-full bg-white/10 rounded-full h-2", children: _jsx("div", { className: `h-2 rounded-full transition-all duration-300 ${getProgressColor()}`, style: { width: `${Math.min(getUsagePercentage(), 100)}%` } }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [_jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx(Zap, { size: 14, className: "text-green-400" }), _jsx("span", { className: "text-white/60 text-sm", children: "Total Used" })] }), _jsx("div", { className: "text-white font-semibold", children: usage.totalUsage })] }), referralStats && (_jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx(Users, { size: 14, className: "text-blue-400" }), _jsx("span", { className: "text-white/60 text-sm", children: "Invites" })] }), _jsx("div", { className: "text-white font-semibold", children: referralStats.invites })] }))] }), referralStats && (_jsxs("div", { className: "border-t border-white/10 pt-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h4", { className: "text-white font-semibold", children: "Invite Friends" }), _jsx(Gift, { size: 16, className: "text-purple-400" })] }), _jsxs("button", { onClick: () => {
                            // This will be handled by the parent component
                            if (typeof window !== 'undefined' && window.location.pathname === '/profile') {
                                // If we're on the profile page, trigger the modal
                                const event = new CustomEvent('openInviteModal');
                                window.dispatchEvent(event);
                            }
                            else {
                                // Navigate to profile page
                                window.location.href = '/profile';
                            }
                        }, className: "w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center space-x-2", children: [_jsx(Users, { size: 16 }), _jsx("span", { children: "Invite Friends via Email" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mt-4", children: [_jsxs("div", { className: "bg-white/5 rounded-lg p-3 text-center", children: [_jsx("div", { className: "text-xl font-bold text-white", children: referralStats.invites }), _jsx("div", { className: "text-white/60 text-xs", children: "Friends Invited" })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-3 text-center", children: [_jsx("div", { className: "text-xl font-bold text-white", children: referralStats.tokensEarned }), _jsx("div", { className: "text-white/60 text-xs", children: "Tokens Earned" })] })] })] }))] }));
};
export default ProfileTokenDisplay;
