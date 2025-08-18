// Notification Service for Stefna AI Photo App
// Handles push notifications, permissions, and smart scheduling
class NotificationService {
    constructor() {
        Object.defineProperty(this, "notifications", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "settings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                likes: true,
                remixes: true,
                announcements: true,
                system: true,
                emailNotifications: false,
                pushNotifications: false
            }
        });
    }
    // Get all notifications for a user
    async getUserNotifications(userId) {
        // In a real app, this would fetch from backend
        return this.notifications.filter(n => n.userId === userId);
    }
    // Get unread notifications count
    async getUnreadCount(userId) {
        const userNotifications = await this.getUserNotifications(userId);
        return userNotifications.filter(n => !n.read).length;
    }
    // Mark notification as read
    async markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }
    // Mark all notifications as read
    async markAllAsRead(userId) {
        const userNotifications = this.notifications.filter(n => n.userId === userId);
        userNotifications.forEach(n => n.read = true);
    }
    // Create a new notification
    async createNotification(notification) {
        const newNotification = {
            ...notification,
            id: this.generateId(),
            timestamp: new Date(),
            read: false
        };
        // Check if user wants this type of notification
        if (this.shouldShowNotification(newNotification)) {
            this.notifications.push(newNotification);
            // Show toast notification if enabled
            if (this.settings.pushNotifications) {
                this.showToastNotification(newNotification);
            }
        }
        return newNotification;
    }
    // Create like notification
    async createLikeNotification(userId, contentId, likerName) {
        return this.createNotification({
            type: 'like',
            title: 'New Like',
            message: `${likerName} liked your content`,
            userId,
            relatedContentId: contentId,
            priority: 'low'
        });
    }
    // Create remix notification
    async createRemixNotification(userId, contentId, remixerName) {
        return this.createNotification({
            type: 'remix',
            title: 'New Remix',
            message: `${remixerName} remixed your content`,
            userId,
            relatedContentId: contentId,
            priority: 'medium'
        });
    }
    // Create announcement notification
    async createAnnouncementNotification(userId, title, message) {
        return this.createNotification({
            type: 'announcement',
            title,
            message,
            userId,
            priority: 'high'
        });
    }
    // Create system notification
    async createSystemNotification(userId, title, message) {
        return this.createNotification({
            type: 'system',
            title,
            message,
            userId,
            priority: 'medium'
        });
    }
    // Check if notification should be shown based on user settings
    shouldShowNotification(notification) {
        switch (notification.type) {
            case 'like':
                return this.settings.likes;
            case 'remix':
                return this.settings.remixes;
            case 'announcement':
                return this.settings.announcements;
            case 'system':
                return this.settings.system;
            default:
                return true;
        }
    }
    // Show toast notification
    showToastNotification(notification) {
        // This would integrate with a toast library like react-hot-toast
        console.log('Toast notification:', notification.title, notification.message);
    }
    // Get notification settings
    async getSettings() {
        return this.settings;
    }
    // Update notification settings
    async updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }
    // Delete notification
    async deleteNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    }
    // Clear all notifications for a user
    async clearAllNotifications(userId) {
        this.notifications = this.notifications.filter(n => n.userId !== userId);
    }
    // Generate unique ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    // Get notifications by type
    async getNotificationsByType(userId, type) {
        const userNotifications = await this.getUserNotifications(userId);
        return userNotifications.filter(n => n.type === type);
    }
    // Get recent notifications (last 7 days)
    async getRecentNotifications(userId) {
        const userNotifications = await this.getUserNotifications(userId);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return userNotifications.filter(n => n.timestamp > sevenDaysAgo);
    }
}
const notificationService = new NotificationService();
export default notificationService;
