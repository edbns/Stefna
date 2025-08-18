import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// Notification Bell Component
// Shows notification count and dropdown with anonymous remix notifications
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
const NotificationBell = ({ className = '' }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    // Fetch notifications
    const fetchNotifications = async () => {
        // Skip in NO_DB_MODE
        if (import.meta.env.VITE_NO_DB_MODE === '1') {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        try {
            setLoading(true);
            const response = await fetch('/.netlify/functions/get-notifications?limit=10', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        }
        catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Mark notifications as read
    const markAsRead = async (notificationIds) => {
        // Skip in NO_DB_MODE
        if (import.meta.env.VITE_NO_DB_MODE === '1') {
            return;
        }
        try {
            const response = await fetch('/.netlify/functions/mark-notifications-read', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notificationIds }),
            });
            if (response.ok) {
                // Refresh notifications
                await fetchNotifications();
            }
        }
        catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };
    // Fetch notifications on mount
    useEffect(() => {
        fetchNotifications();
    }, []);
    // Format relative time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins}m ago`;
        if (diffHours < 24)
            return `${diffHours}h ago`;
        if (diffDays < 7)
            return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };
    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };
    const handleNotificationClick = async (notification) => {
        // Mark this notification as read
        if (!notification.read) {
            await markAsRead([notification.id]);
        }
        // Close dropdown
        setIsOpen(false);
        // Navigate to the media (optional - could open fullscreen viewer)
        console.log('Navigate to media:', notification.mediaId);
    };
    const handleMarkAllRead = async () => {
        await markAsRead(); // Mark all as read
        setIsOpen(false);
    };
    return (_jsxs("div", { className: `relative ${className}`, children: [_jsxs("button", { onClick: handleBellClick, className: "relative w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300", title: "Notifications", "aria-label": `Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`, children: [_jsx(Bell, { size: 18, className: "text-white" }), unreadCount > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center", children: unreadCount > 9 ? '9+' : unreadCount }))] }), isOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setIsOpen(false) }), _jsx("div", { className: "absolute right-0 top-12 w-80 bg-[#333333] border border-white/20 rounded-2xl shadow-2xl z-50", children: _jsx("div", { className: "p-2", children: loading ? (_jsx("div", { className: "px-3 py-2 text-center text-white/60 text-sm", children: "Loading..." })) : notifications.length === 0 ? (_jsx("div", { className: "px-3 py-2 text-center text-white/60 text-sm", children: "No notifications yet" })) : (_jsxs(_Fragment, { children: [notifications.slice(0, 5).map((notification) => (_jsxs("button", { onClick: () => handleNotificationClick(notification), className: `w-full text-left px-3 py-2 rounded-lg transition-colors ${!notification.read
                                            ? 'bg-white/10 text-white hover:bg-white/15'
                                            : 'text-white/70 hover:text-white hover:bg-white/5'}`, children: [_jsx("div", { className: "text-sm", children: notification.message }), _jsx("div", { className: "text-xs text-white/50 mt-1", children: formatTime(notification.createdAt) })] }, notification.id))), unreadCount > 0 && (_jsx("button", { onClick: handleMarkAllRead, className: "w-full text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm border-t border-white/10 mt-1 pt-3", children: "Mark all read" }))] })) }) })] }))] }));
};
export default NotificationBell;
