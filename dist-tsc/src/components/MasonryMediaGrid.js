import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useMemo } from 'react';
import RemixIcon from './RemixIcon';
import { MediaCard as SpinnerCard } from './ui/Toasts';
import LazyImage from './LazyImage';
import { formatRemixCount } from '../utils/mediaCardHelpers';
const MasonryMediaGrid = ({ media, onMediaClick, onDownload, onRemix, onDelete, showActions = true, className = '', 
// Selection props
isSelectionMode = false, selectedMediaIds = new Set(), onToggleSelection, 
// Auth props
onShowAuth, isLoggedIn = true }) => {
    const gridRef = useRef(null);
    // Generate true masonry layout based on aspect ratios
    const masonryColumns = useMemo(() => {
        if (media.length === 0)
            return [];
        // Always use exactly 3 columns for consistent layout
        const numColumns = 3;
        const columnArrays = Array.from({ length: numColumns }, () => []);
        // Simple distribution: put each item in the shortest column
        media.forEach((item) => {
            // Find the shortest column
            const columnHeights = columnArrays.map(column => column.reduce((height, mediaItem) => height + (1 / mediaItem.aspectRatio), 0));
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
            // Add item to shortest column
            columnArrays[shortestColumnIndex].push(item);
        });
        return columnArrays;
    }, [media]);
    const handleAction = (action, event) => {
        event.stopPropagation();
        action();
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case 'video':
                return (_jsx("div", { className: "absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1", children: _jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "white", children: _jsx("path", { d: "M8 5v14l11-7z" }) }) }));
            case 'remix':
                return (_jsx("div", { className: "absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1", children: _jsx(RemixIcon, { size: 12, className: "text-white" }) }));
            default:
                return null;
        }
    };
    if (media.length === 0) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-full", children: [_jsx("div", { className: "w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6", children: _jsxs("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", className: "text-white/40", children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }), _jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }), _jsx("polyline", { points: "21,15 16,10 5,21" })] }) }), _jsx("p", { className: "text-white/60 text-lg text-center", children: "No media found" }), _jsx("p", { className: "text-white/40 text-sm text-center mt-2", children: "Media will appear here" })] }));
    }
    return (_jsx("div", { className: `${className}`, ref: gridRef, children: _jsx("div", { className: "flex gap-2 mx-auto", style: { maxWidth: '1200px' }, children: masonryColumns.map((column, columnIndex) => (_jsx("div", { className: "flex-1 flex flex-col gap-2 min-w-0", children: column.map((item) => (_jsx("div", { className: "relative group cursor-pointer bg-white/5 overflow-hidden", onClick: () => onMediaClick?.(item), children: _jsxs("div", { className: "relative w-full overflow-hidden", children: [isSelectionMode && onToggleSelection && (_jsx("div", { className: "absolute top-2 left-2 z-10", children: _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        onToggleSelection(item.id);
                                    }, className: `w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedMediaIds.has(item.id)
                                        ? 'bg-white border-white'
                                        : 'bg-black/60 border-white/60 hover:border-white'}`, title: selectedMediaIds.has(item.id) ? 'Deselect' : 'Select', children: selectedMediaIds.has(item.id) && (_jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", className: "text-black", children: _jsx("polyline", { points: "20,6 9,17 4,12" }) })) }) })), item.status === 'processing' ? (_jsx(SpinnerCard, { kind: item.type === 'video' ? 'video' : 'image', status: "processing", src: item.thumbnailUrl || item.url, onClick: () => onMediaClick?.(item) })) : item.status === 'failed' ? (_jsxs("div", { className: "relative", children: [item.type === 'video' ? (_jsx("video", { src: item.url, className: "w-full h-auto object-cover opacity-50", muted: true })) : (_jsx(LazyImage, { src: item.url, alt: item.prompt, className: "w-full h-auto opacity-50", quality: 60, format: "auto" })), _jsx("div", { className: "absolute inset-0 grid place-items-center", children: _jsx("div", { className: "px-3 py-1 rounded-full bg-red-600/80 text-white text-xs font-semibold", children: "Failed" }) })] })) : item.type === 'video' ? (_jsx("video", { src: item.url, className: "w-full h-auto object-cover", muted: true, loop: true, onMouseEnter: (e) => e.currentTarget.play(), onMouseLeave: (e) => e.currentTarget.pause() })) : (_jsx(LazyImage, { src: item.url, alt: item.prompt, priority: media.findIndex(m => m.id === item.id) < 6, quality: 85, format: "auto", sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw", className: "w-full h-auto object-cover" })), getTypeIcon(item.type), (() => {
                                const remixText = formatRemixCount(item.remixCount);
                                return (_jsx(_Fragment, { children: showActions && (_jsxs(_Fragment, { children: [onRemix && (_jsx("div", { className: "absolute bottom-2 right-2 opacity-100 transition-opacity duration-300", children: _jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        if (!isLoggedIn) {
                                                            onShowAuth?.();
                                                            return;
                                                        }
                                                        onRemix(item);
                                                    }, className: "w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-105", title: "Remix this creation", "aria-label": "Remix this media", children: _jsx(RemixIcon, { size: 15, className: "text-white" }) }) })), (onDownload || onDelete) && (_jsxs("div", { className: "absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300", children: [onDownload && (_jsx("button", { onClick: (e) => handleAction(() => onDownload(item), e), className: "w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200", title: "Download", children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", className: "text-white", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "7,10 12,15 17,10" }), _jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })] }) })), onDelete && (_jsx("button", { onClick: (e) => handleAction(() => onDelete(item), e), className: "w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-500/80 transition-all duration-200", title: "Delete", children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", className: "text-white", children: [_jsx("polyline", { points: "3,6 5,6 21,6" }), _jsx("path", { d: "M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" })] }) }))] }))] })) }));
                            })()] }) }, item.id))) }, columnIndex))) }) }));
};
export default MasonryMediaGrid;
