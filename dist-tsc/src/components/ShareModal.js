import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Instagram, Twitter, Facebook, MessageCircle, Send, Copy, Download, Share2, Sparkles } from 'lucide-react';
const ShareModal = ({ isOpen, onClose, mediaUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjI0Ij5BSSBDcmVhdGlvbiBWaWRlbzwvdGV4dD48L3N2Zz4=', caption = 'Check out my amazing AI creation! #AIasABrush #Stefna', title = 'Share Your Creation' }) => {
    const [selectedCaptionStyle, setSelectedCaptionStyle] = useState('casual');
    const [customCaption, setCustomCaption] = useState(caption);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const platforms = [
        {
            id: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            color: '#E4405F',
            gradient: 'from-[#E4405F] to-[#F77737]'
        },
        {
            id: 'twitter',
            name: 'X',
            icon: Twitter,
            color: '#1DA1F2',
            gradient: 'from-[#1DA1F2] to-[#0D8BD9]'
        },
        {
            id: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            color: '#1877F2',
            gradient: 'from-[#1877F2] to-[#0D6EFD]'
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: MessageCircle,
            color: '#25D366',
            gradient: 'from-[#25D366] to-[#128C7E]'
        },
        {
            id: 'telegram',
            name: 'Telegram',
            icon: Send,
            color: '#0088CC',
            gradient: 'from-[#0088CC] to-[#006699]'
        }
    ];
    const captionStyles = [
        { id: 'casual', name: 'Casual', example: 'Just created this with AI! 🔥' },
        { id: 'professional', name: 'Professional', example: 'AI-powered creative transformation using Stefna.' },
        { id: 'trendy', name: 'Trendy', example: 'This AI magic is everything! ✨ #Viral' },
        { id: 'artistic', name: 'Artistic', example: 'Exploring the boundaries of AI creativity 🎨' }
    ];
    const handleShare = (platformId) => {
        const shareUrl = `https://stefna.app/share/${Date.now()}`;
        const shareText = customCaption;
        let url = '';
        switch (platformId) {
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                break;
            case 'telegram':
                url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
                break;
            default:
                url = shareUrl;
        }
        window.open(url, '_blank', 'width=600,height=400');
    };
    const handleCopyCaption = async () => {
        try {
            await navigator.clipboard.writeText(customCaption);
            setIsCopying(true);
            setTimeout(() => setIsCopying(false), 2000);
        }
        catch (error) {
            console.error('Failed to copy caption:', error);
        }
    };
    const handleDownload = () => {
        setIsDownloading(true);
        // Simulate download
        setTimeout(() => {
            setIsDownloading(false);
            alert('Download started!');
        }, 1000);
    };
    const handleCaptionStyleChange = (styleId) => {
        setSelectedCaptionStyle(styleId);
        const style = captionStyles.find(s => s.id === styleId);
        if (style) {
            setCustomCaption(style.example);
        }
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-end justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { className: "relative w-full max-w-md bg-white/5 backdrop-blur-md border border-white/20 rounded-t-3xl shadow-2xl", children: [_jsx("div", { className: "flex justify-center pt-4 pb-2", children: _jsx("div", { className: "w-12 h-1 bg-white/20 rounded-full" }) }), _jsxs("div", { className: "text-center px-6 py-4 border-b border-white/10", children: [_jsx("div", { className: "w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Share2, { size: 24, className: "text-white" }) }), _jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: title }), _jsx("p", { className: "text-white/60", children: "Share your creation with the world" })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Your Creation" }), _jsx("div", { className: "aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-[#FF6B9D] to-[#00D4FF] flex items-center justify-center border border-white/20", children: _jsxs("div", { className: "text-center", children: [_jsx(Sparkles, { size: 48, className: "text-white mx-auto mb-4" }), _jsx("p", { className: "text-white font-semibold", children: "Your Creation" })] }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Caption Style" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: captionStyles.map((style) => (_jsxs("button", { onClick: () => handleCaptionStyleChange(style.id), className: `p-3 rounded-lg text-left transition-all duration-300 border ${selectedCaptionStyle === style.id
                                                ? 'border-white/40 bg-white/20 text-white'
                                                : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`, children: [_jsx("div", { className: "text-sm font-medium", children: style.name }), _jsx("div", { className: "text-xs mt-1 opacity-80", children: style.example })] }, style.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Custom Caption" }), _jsx("textarea", { value: customCaption, onChange: (e) => setCustomCaption(e.target.value), placeholder: "Write your caption...", className: "w-full h-24 p-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 resize-none focus:outline-none focus:border-white/40 focus:bg-white/10", rows: 3 }), _jsxs("div", { className: "flex justify-between items-center mt-2", children: [_jsxs("span", { className: "text-xs text-white/40", children: [customCaption.length, "/280 characters"] }), _jsxs("button", { onClick: handleCopyCaption, className: "text-xs text-white/60 hover:text-white transition-colors flex items-center space-x-1", children: [_jsx(Copy, { size: 16 }), _jsx("span", { children: isCopying ? 'Copied!' : 'Copy' })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Share to Platform" }), _jsx("div", { className: "grid grid-cols-5 gap-3", children: platforms.map((platform) => {
                                            const Icon = platform.icon;
                                            return (_jsxs("button", { onClick: () => handleShare(platform.id), className: "flex flex-col items-center space-y-2 p-3 rounded-lg bg-white/5 border border-white/20 hover:border-white/40 transition-all duration-300", children: [_jsx("div", { className: `w-12 h-12 rounded-full bg-gradient-to-r ${platform.gradient} flex items-center justify-center`, children: _jsx(Icon, { size: 24, className: "text-white" }) }), _jsx("span", { className: "text-xs text-white font-medium", children: platform.name })] }, platform.id));
                                        }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: handleDownload, disabled: isDownloading, className: "w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 bg-white text-black hover:bg-white/90", children: isDownloading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" }), _jsx("span", { children: "Downloading..." })] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { size: 16 }), _jsx("span", { children: "Download" })] })) }), _jsx("button", { onClick: onClose, className: "w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 bg-white/5 text-white hover:bg-white/10", children: _jsx("span", { children: "Close" }) })] })] })] })] }));
};
export default ShareModal;
