import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { User, Zap, Clock, AlertCircle } from 'lucide-react';
import tokenService, { UserTier } from '../services/tokenService';
import { authenticatedFetch } from '../utils/apiClient';
const TokenUsageDisplay = ({ userId, userTier, className = '' }) => {
    const [usage, setUsage] = useState(null);
    const [serverQuota, setServerQuota] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        loadUserUsage();
        loadServerQuota();
    }, [userId]);
    const loadUserUsage = async () => {
        try {
            const userUsage = await tokenService.getUserUsage(userId);
            setUsage(userUsage);
        }
        catch (error) {
            console.error('Failed to load token usage:', error);
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
    const getTierColor = (tier) => {
        switch (tier) {
            case UserTier.REGISTERED:
                return 'text-blue-400';
            case UserTier.VERIFIED:
                return 'text-purple-400';
            case UserTier.CONTRIBUTOR:
                return 'text-yellow-400';
            default:
                return 'text-white';
        }
    };
    const getTierName = (tier) => {
        switch (tier) {
            case UserTier.REGISTERED:
                return 'Registered';
            case UserTier.VERIFIED:
                return 'Verified';
            case UserTier.CONTRIBUTOR:
                return 'Contributor';
            default:
                return 'Unknown';
        }
    };
    const getUsagePercentage = () => {
        if (!usage)
            return 0;
        const du = serverQuota ? serverQuota.daily_used : usage.dailyUsage;
        const dl = serverQuota ? serverQuota.daily_limit : usage.dailyLimit;
        return (du / dl) * 100;
    };
    const getUsageColor = () => {
        const percentage = getUsagePercentage();
        if (percentage >= 90)
            return 'text-red-400';
        if (percentage >= 75)
            return 'text-yellow-400';
        return 'text-green-400';
    };
    if (isLoading) {
        return (_jsx("div", { className: `bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 ${className}`, children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-4 bg-white/10 rounded mb-2" }), _jsx("div", { className: "h-3 bg-white/10 rounded" })] }) }));
    }
    if (!usage) {
        return null;
    }
    return (_jsxs("div", { className: `bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 ${className}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(User, { size: 16, className: getTierColor(userTier) }), _jsx("span", { className: `text-sm font-medium ${getTierColor(userTier)}`, children: getTierName(userTier) })] }), usage.isRateLimited && (_jsxs("div", { className: "flex items-center space-x-1 text-red-400", children: [_jsx(AlertCircle, { size: 14 }), _jsx("span", { className: "text-xs", children: "Rate Limited" })] }))] }), _jsxs("div", { className: "mb-3", children: [_jsxs("div", { className: "flex justify-between text-xs mb-1", children: [_jsx("span", { className: "text-white/60", children: "Daily Usage" }), _jsxs("span", { className: `font-medium ${getUsageColor()}`, children: [serverQuota ? serverQuota.daily_used : usage.dailyUsage, " / ", serverQuota ? serverQuota.daily_limit : usage.dailyLimit] })] }), _jsx("div", { className: "w-full bg-white/10 rounded-full h-2", children: _jsx("div", { className: `h-2 rounded-full transition-all duration-300 ${getUsagePercentage() >= 90 ? 'bg-red-400' :
                                getUsagePercentage() >= 75 ? 'bg-yellow-400' : 'bg-green-400'}`, style: { width: `${Math.min(getUsagePercentage(), 100)}%` } }) })] }), _jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("div", { className: "flex items-center space-x-1 text-white/60", children: [_jsx(Zap, { size: 12 }), _jsxs("span", { children: ["Remaining: ", (serverQuota ? serverQuota.daily_limit - serverQuota.daily_used : usage.dailyLimit - usage.dailyUsage)] })] }), _jsxs("div", { className: "flex items-center space-x-1 text-white/40", children: [_jsx(Clock, { size: 12 }), _jsx("span", { children: "Resets daily" })] })] }), getUsagePercentage() >= 90 && (_jsx("div", { className: "mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400", children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(AlertCircle, { size: 12 }), _jsx("span", { children: "Daily limit almost reached" })] }) })), usage.isRateLimited && (_jsx("div", { className: "mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400", children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Clock, { size: 12 }), _jsx("span", { children: "Please wait 30 seconds between generations" })] }) }))] }));
};
export default TokenUsageDisplay;
