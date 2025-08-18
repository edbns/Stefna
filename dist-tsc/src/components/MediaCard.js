import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import RemixIcon from './RemixIcon';
const MediaCard = ({ id, title, gradient, icon: IconComponent, isLoggedIn, onRemix, onShowAuth, onShowMedia, aspectRatio = 1, media }) => {
    const handleRemix = () => {
        if (!isLoggedIn) {
            onShowAuth();
            return;
        }
        if (onRemix) {
            onRemix(id);
        }
    };
    // Determine aspect ratio class
    const getAspectClass = () => {
        if (aspectRatio <= 0.6) {
            return 'aspect-[9/16]';
        }
        else {
            return 'aspect-square';
        }
    };
    return (_jsxs("div", { className: `${getAspectClass()} relative bg-white/5 overflow-hidden cursor-pointer group`, onClick: (e) => {
            e.stopPropagation();
            onShowMedia?.(id, title);
        }, children: [_jsx("div", { className: `w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative`, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center mb-3", children: _jsx(IconComponent, { size: 28, className: "text-white" }) }), _jsx("p", { className: "text-white/60 text-sm text-center", children: title })] }) }), _jsx("div", { className: "absolute inset-0 bg-black/20 transition-all duration-300", children: _jsx("div", { className: "absolute bottom-3 right-3 flex items-center gap-2 opacity-100 transition-opacity duration-300", children: onRemix && (_jsx("button", { onClick: (e) => { e.stopPropagation(); handleRemix(); }, className: "w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-105", title: "Remix this creation", "aria-label": "Remix this media", children: _jsx(RemixIcon, { size: 16, className: "text-white" }) })) }) })] }));
};
export default MediaCard;
