import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const AdminUpgrade = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [newTier, setNewTier] = useState('contributor');
    const [adminSecret, setAdminSecret] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const handleUpgrade = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');
        try {
            const response = await fetch('/.netlify/functions/admin-upgrade-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    newTier,
                    adminSecret
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to upgrade user');
            }
            setMessage(data.message || 'User upgraded successfully!');
            setEmail('');
            setAdminSecret('');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-[#222222] border border-white/20 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Admin Upgrade" }), _jsx("button", { onClick: onClose, className: "text-white/60 hover:text-white transition-colors", children: "\u2715" })] }), _jsxs("form", { onSubmit: handleUpgrade, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-white/60 text-sm mb-2", children: "Email Address" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10", placeholder: "Enter user email", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-white/60 text-sm mb-2", children: "New Tier" }), _jsxs("select", { value: newTier, onChange: (e) => setNewTier(e.target.value), className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 focus:bg-white/10", children: [_jsx("option", { value: "registered", children: "Registered (115 tokens/day)" }), _jsx("option", { value: "verified", children: "Verified (215 tokens/day)" }), _jsx("option", { value: "contributor", children: "Contributor (410 tokens/day)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-white/60 text-sm mb-2", children: "Admin Secret" }), _jsx("input", { type: "password", value: adminSecret, onChange: (e) => setAdminSecret(e.target.value), className: "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10", placeholder: "Enter admin secret", required: true })] }), message && (_jsx("div", { className: "p-3 bg-green-500/20 border border-green-500/30 rounded-lg", children: _jsx("p", { className: "text-green-400 text-sm", children: message }) })), error && (_jsx("div", { className: "p-3 bg-red-500/20 border border-red-500/30 rounded-lg", children: _jsx("p", { className: "text-red-400 text-sm", children: error }) })), _jsxs("div", { className: "flex space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors", children: "Cancel" }), _jsx("button", { type: "submit", disabled: isLoading || !email || !adminSecret, className: "flex-1 px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: isLoading ? 'Upgrading...' : 'Upgrade User' })] })] })] }) }));
};
export default AdminUpgrade;
