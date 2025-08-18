import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Validation Summary Component
// Shows validation results for the preset system (dev mode only)
import { useState, useEffect } from 'react';
import { validateAllSync } from '../utils/presets';
const ValidationSummary = ({ showInProduction = false }) => {
    const [validationResults, setValidationResults] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    useEffect(() => {
        // Only show in development mode unless explicitly enabled
        if (!showInProduction && process.env.NODE_ENV === 'production') {
            return;
        }
        const results = validateAllSync();
        setValidationResults(results);
    }, [showInProduction]);
    // Don't render in production unless explicitly enabled
    if (!showInProduction && process.env.NODE_ENV === 'production') {
        return null;
    }
    if (!validationResults) {
        return null;
    }
    const totalErrors = validationResults.presetErrors.length +
        validationResults.optionErrors.length +
        validationResults.uiErrors.length;
    if (totalErrors === 0) {
        return (_jsx("div", { className: "fixed bottom-4 right-4 bg-green-600/90 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm border border-green-500/50", children: "\u2705 Preset system validated" }));
    }
    return (_jsxs("div", { className: "fixed bottom-4 right-4 bg-red-600/90 text-white rounded-lg backdrop-blur-sm border border-red-500/50 max-w-md", children: [_jsxs("button", { onClick: () => setIsExpanded(!isExpanded), className: "w-full px-3 py-2 text-left flex items-center justify-between hover:bg-red-500/20 transition-colors", children: [_jsxs("span", { className: "text-sm font-medium", children: ["\u26A0\uFE0F ", totalErrors, " validation issue", totalErrors !== 1 ? 's' : ''] }), _jsx("span", { className: "text-xs", children: isExpanded ? '▼' : '▶' })] }), isExpanded && (_jsxs("div", { className: "border-t border-red-500/50 p-3 max-h-64 overflow-y-auto", children: [validationResults.presetErrors.length > 0 && (_jsxs("div", { className: "mb-3", children: [_jsxs("h4", { className: "text-xs font-semibold text-red-200 mb-1", children: ["Preset Errors (", validationResults.presetErrors.length, ")"] }), _jsx("ul", { className: "text-xs space-y-1", children: validationResults.presetErrors.map((error, index) => (_jsxs("li", { className: "text-red-100", children: ["\u2022 ", error] }, index))) })] })), validationResults.optionErrors.length > 0 && (_jsxs("div", { className: "mb-3", children: [_jsxs("h4", { className: "text-xs font-semibold text-red-200 mb-1", children: ["Option Errors (", validationResults.optionErrors.length, ")"] }), _jsx("ul", { className: "text-xs space-y-1", children: validationResults.optionErrors.map((error, index) => (_jsxs("li", { className: "text-red-100", children: ["\u2022 ", error] }, index))) })] })), validationResults.uiErrors.length > 0 && (_jsxs("div", { className: "mb-3", children: [_jsxs("h4", { className: "text-xs font-semibold text-red-200 mb-1", children: ["UI Configuration Errors (", validationResults.uiErrors.length, ")"] }), _jsx("ul", { className: "text-xs space-y-1", children: validationResults.uiErrors.map((error, index) => (_jsxs("li", { className: "text-red-100", children: ["\u2022 ", error] }, index))) })] })), _jsx("div", { className: "text-xs text-red-200 mt-2 pt-2 border-t border-red-500/30", children: "Check console for detailed logs" })] }))] }));
};
export default ValidationSummary;
