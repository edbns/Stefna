import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
const OTPInput = ({ length = 6, onComplete, disabled = false }) => {
    const [otp, setOtp] = useState(new Array(length).fill(''));
    const inputRefs = useRef([]);
    useEffect(() => {
        // Auto-focus first input
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);
    useEffect(() => {
        // Check if OTP is complete
        const otpString = otp.join('');
        if (otpString.length === length) {
            onComplete(otpString);
        }
    }, [otp, length, onComplete]);
    const handleChange = (index, value) => {
        if (disabled)
            return;
        // Only allow single digit
        if (value.length > 1)
            return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        // Move to next input if value is entered
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };
    const handleKeyDown = (index, e) => {
        if (disabled)
            return;
        // Handle backspace
        if (e.key === 'Backspace') {
            if (otp[index]) {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
            else if (index > 0) {
                // Move to previous input
                inputRefs.current[index - 1]?.focus();
            }
        }
    };
    const handlePaste = (e) => {
        if (disabled)
            return;
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
        if (/^\d+$/.test(pastedData)) {
            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData[i];
            }
            setOtp(newOtp);
            // Focus last filled input or next empty input
            const focusIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[focusIndex]?.focus();
        }
    };
    return (_jsx("div", { className: "flex justify-center gap-2", children: otp.map((digit, index) => (_jsx("input", { ref: (el) => (inputRefs.current[index] = el), type: "text", inputMode: "numeric", pattern: "[0-9]*", maxLength: 1, value: digit, onChange: (e) => handleChange(index, e.target.value), onKeyDown: (e) => handleKeyDown(index, e), onPaste: handlePaste, disabled: disabled, className: `
            w-12 h-12 text-center text-lg font-semibold
            border-2 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-all duration-200
            ${disabled
                ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white border-gray-300 text-black focus:border-blue-500'}
          ` }, index))) }));
};
export default OTPInput;
