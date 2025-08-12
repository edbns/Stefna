import React, { useState, useEffect } from 'react'
import { Bell, X, Trash2, Check } from 'lucide-react'
import notificationService, { Notification } from '../services/notificationService'

interface NotificationBellProps {
  userId: string
  className?: string
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [userId])

  // Listen for global nav close events (when other menus open)
  useEffect(() => {
    const onGlobalClose = () => setIsOpen(false)
    window.addEventListener('global-nav-close', onGlobalClose as any)
    return () => window.removeEventListener('global-nav-close', onGlobalClose as any)
  }, [])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const userNotifications = await notificationService.getUserNotifications(userId)
      const unread = await notificationService.getUnreadCount(userId)
      
      setNotifications(userNotifications)
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      await loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(userId)
      await loadNotifications()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId)
      await loadNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Toggle notification panel - clicking same icon closes it
  const toggleNotifications = () => {
    setIsOpen(!isOpen)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'info':
        return 'ℹ️'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400'
      case 'warning':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      case 'info':
        return 'text-blue-400'
      default:
        return 'text-white'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return timestamp.toLocaleDateString()
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={toggleNotifications}
        className="nav-icon text-white hover:text-white/80 transition-colors duration-300"
        title="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Bell size={20} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#222222] border border-white/20 rounded-2xl shadow-2xl z-50">
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-white/60">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-white/60">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-white/5 transition-colors ${
                      !notification.read ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                              {notification.title}
                            </h4>
                            <p className="text-xs text-white/60 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 text-white/40 hover:text-white transition-colors"
                                title="Mark as read"
                              >
                                <Check size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-1 text-white/40 hover:text-red-400 transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default NotificationBell
