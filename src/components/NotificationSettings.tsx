import React, { useState, useEffect } from 'react'
import { Bell, X, Check } from 'lucide-react'
import notificationService, { NotificationSettings } from '../services/notificationService'

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose, userId }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    likes: true,
    remixes: true,
    announcements: true,
    system: true,
    emailNotifications: false,
    pushNotifications: false
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen, userId])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const userSettings = await notificationService.getSettings()
      setSettings(userSettings)
    } catch (error) {
      console.error('Error loading notification settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    try {
      await notificationService.updateSettings({ [key]: value })
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  }

  const handleSaveAll = async () => {
    try {
      await notificationService.updateSettings(settings)
      onClose()
    } catch (error) {
      console.error('Error saving notification settings:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-black border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-semibold">Notification Settings</h2>
              <p className="text-white/60 text-sm">Control what notifications you receive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          {/* Notification Types */}
          <div>
            <h3 className="text-white font-medium mb-3">Notification Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white text-sm font-medium">Likes</label>
                  <p className="text-white/60 text-xs">When someone likes your content</p>
                </div>
                <button
                  onClick={() => handleSettingChange('likes', !settings.likes)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    settings.likes ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${
                      settings.likes ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white text-sm font-medium">Remixes</label>
                  <p className="text-white/60 text-xs">When someone remixes your content</p>
                </div>
                <button
                  onClick={() => handleSettingChange('remixes', !settings.remixes)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    settings.remixes ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${
                      settings.remixes ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white text-sm font-medium">Announcements</label>
                  <p className="text-white/60 text-xs">Important updates and new features</p>
                </div>
                <button
                  onClick={() => handleSettingChange('announcements', !settings.announcements)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    settings.announcements ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${
                      settings.announcements ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white text-sm font-medium">System</label>
                  <p className="text-white/60 text-xs">Account and security notifications</p>
                </div>
                <button
                  onClick={() => handleSettingChange('system', !settings.system)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    settings.system ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${
                      settings.system ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Methods */}
          <div>
            <h3 className="text-white font-medium mb-3">Delivery Methods</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white text-sm font-medium">Push Notifications</label>
                  <p className="text-white/60 text-xs">Show notifications in browser</p>
                </div>
                <button
                  onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    settings.pushNotifications ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${
                      settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white text-sm font-medium">Email Notifications</label>
                  <p className="text-white/60 text-xs">Receive notifications via email</p>
                </div>
                <button
                  onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    settings.emailNotifications ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors border border-white/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="flex-1 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings 