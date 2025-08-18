import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const CountdownTimer = ({ duration, onExpire, className = '' }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    useEffect(() => {
        if (timeLeft <= 0) {
            onExpire();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    onExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onExpire]);
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    const getProgressPercentage = () => {
        return ((duration - timeLeft) / duration) * 100;
    };
    return (_jsxs("div", { className: `flex flex-col items-center ${className}`, children: [_jsx("div", { className: "text-sm text-gray-600 mb-2", children: "Code expires in" }), _jsx("div", { className: "text-lg font-semibold text-gray-800", children: formatTime(timeLeft) }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-1 mt-2", children: _jsx("div", { className: "bg-red-500 h-1 rounded-full transition-all duration-1000", style: { width: `${getProgressPercentage()}%` } }) })] }));
};
export default CountdownTimer;
