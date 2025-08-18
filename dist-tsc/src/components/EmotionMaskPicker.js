import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EMOTION_MASK_PRESETS } from '../presets/emotionmask';
export function EmotionMaskPicker({ presets = EMOTION_MASK_PRESETS, value, onChange, disabled = false, }) {
    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("button", { onClick: () => onChange?.(''), className: (() => {
                    const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
                    const activeClass = 'bg-white/20 text-white';
                    const inactiveClass = 'text-white/80 hover:text-white hover:bg-white/10';
                    return `${baseClass} ${!value ? activeClass : inactiveClass}`;
                })(), children: [_jsx("span", { children: "None" }), !value && (_jsx("div", { className: "w-4 h-4 rounded-full bg-white border-2 border-white/30" }))] }), presets.map((preset) => (_jsxs("button", { onClick: () => onChange?.(preset.id), className: (() => {
                    const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
                    const activeClass = 'bg-white/20 text-white';
                    const inactiveClass = 'text-white/80 hover:text-white hover:bg-white/10';
                    return `${baseClass} ${value === preset.id ? activeClass : inactiveClass}`;
                })(), children: [_jsx("span", { children: preset.label }), value === preset.id ? (_jsx("div", { className: "w-4 h-4 rounded-full bg-white border-2 border-white/30" })) : (_jsx("div", { className: "w-4 h-4 rounded-full border-2 border-white/30" }))] }, preset.id)))] }));
}
