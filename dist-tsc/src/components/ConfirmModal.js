import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmButtonClass = 'bg-red-500 hover:bg-red-600', cancelButtonClass = 'bg-white/10 hover:bg-white/20' }) => {
    if (!isOpen)
        return null;
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { className: "relative bg-[#111111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/20", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-white text-lg font-semibold", children: title }), _jsx("button", { onClick: onClose, className: "text-white/60 hover:text-white transition-colors", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-white/80 text-sm", children: message }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { onClick: onClose, className: `px-4 py-2 text-white rounded-lg transition-colors ${cancelButtonClass}`, children: cancelText }), _jsx("button", { onClick: handleConfirm, className: `px-4 py-2 text-white rounded-lg transition-colors ${confirmButtonClass}`, children: confirmText })] })] })] })] }));
};
export default ConfirmModal;
