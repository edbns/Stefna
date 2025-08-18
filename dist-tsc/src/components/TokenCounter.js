import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import tokenService from '../services/tokenService';
const TokenCounter = ({ userId, className = '' }) => {
    const [remainingTokens, setRemainingTokens] = useState(0);
    const [previousTokens, setPreviousTokens] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    useEffect(() => {
        loadTokenCount();
        // Update every 5 seconds for real-time feel
        const interval = setInterval(loadTokenCount, 5000);
        return () => clearInterval(interval);
    }, [userId]);
    const loadTokenCount = async () => {
        try {
            const usage = await tokenService.getUserUsage(userId);
            const newTokens = usage.dailyLimit - usage.dailyUsage;
            // Check if tokens changed for animation
            if (newTokens !== remainingTokens) {
                setPreviousTokens(remainingTokens);
                setRemainingTokens(newTokens);
                setIsAnimating(true);
                // Stop animation after 1 second
                setTimeout(() => setIsAnimating(false), 1000);
            }
            else {
                setRemainingTokens(newTokens);
            }
        }
        catch (error) {
            console.error('Failed to load token count:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const getTokenColor = () => {
        if (remainingTokens <= 2)
            return 'text-red-400';
        if (remainingTokens <= 5)
            return 'text-yellow-400';
        return 'text-green-400';
    };
    const getAnimationClass = () => {
        if (!isAnimating)
            return '';
        return remainingTokens > previousTokens ? 'animate-pulse scale-110' : 'animate-bounce scale-95';
    };
    if (isLoading) {
        return (_jsx("div", { className: `w-8 h-8 bg-white/10 rounded-full flex items-center justify-center animate-pulse ${className}`, children: _jsx("div", { className: "w-3 h-3 bg-white/20 rounded-full" }) }));
    }
    return (_jsx("div", { className: `w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/20 cursor-pointer ${getAnimationClass()} ${className}`, title: `${remainingTokens} tokens remaining`, children: _jsx("span", { className: `text-sm font-medium ${getTokenColor()}`, children: remainingTokens }) }));
};
export default TokenCounter;
