import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit, Trash2, Send, Bell, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { NotificationService, ScheduledPost } from '../services/NotificationService';

const Schedule: React.FC = () => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: '1',
      content: 'Check out this amazing trending video! 🔥 #trending #viral',
      platform: 'YouTube',
      scheduledTime: '2024-01-15T14:30:00',
      status: 'scheduled',
      userEmail: 'user@example.com'
    },
    {
      id: '2',
      content: 'New content alert! Don\'t miss this trending topic 📈',
      platform: 'TikTok',
      scheduledTime: '2024-01-15T16:00:00',
      status: 'scheduled',
      userEmail: 'user@example.com'
    },
    {
      id: '3',
      content: 'Just published: Latest trends analysis 📊',
      platform: 'Twitter/X',
      scheduledTime: '2024-01-14T12:00:00',
      status: 'published',
      userEmail: 'user@example.com'
    }
  ]);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }

    // Schedule existing reminders
    scheduledPosts.forEach(post => {
      if (post.status === 'scheduled') {
        NotificationService.scheduleReminder(post);
      }
    });

    // Listen for post status updates
    const handlePostStatusUpdate = (event: CustomEvent) => {
      const { postId, status } = event.detail;
      setScheduledPosts(prev => 
        prev.map(post => 
          post.id === postId ? { ...post, status } : post
        )
      );
    };

    window.addEventListener('postStatusUpdate', handlePostStatusUpdate as EventListener);
    
    return () => {
      window.removeEventListener('postStatusUpdate', handlePostStatusUpdate as EventListener);
    };
  }, []);

  const handleSchedulePost = async (postData: Omit<ScheduledPost, 'id' | 'status'>) => {
    const newPost: ScheduledPost = {
      ...postData,
      id: Date.now().toString(),
      status: 'scheduled',
      userEmail: 'user@example.com' // Get from user context
    };
    
    // Add to state
    setScheduledPosts(prev => [...prev, newPost]);
    
    // Schedule the notification
    await NotificationService.scheduleReminder(newPost);
    
    // Show confirmation
    alert(`📅 Post scheduled for ${newPost.platform} at ${new Date(newPost.scheduledTime).toLocaleString()}!\n\n🔔 You'll get browser and email reminders when it's time to post.`);
    
    setShowNewPostModal(false);
  };

  const handleSendNow = async (post: ScheduledPost) => {
    await NotificationService.sendReminder(post);
  };

  const handleDeletePost = (postId: string) => {
    NotificationService.cancelReminder(postId);
    setScheduledPosts(prev => prev.filter(post => post.id !== postId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'reminder-sent': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return 'text-red-600';
      case 'tiktok': return 'text-black';
      case 'twitter/x': return 'text-blue-500';
      case 'instagram': return 'text-pink-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-button" />
          <h1 className="text-3xl font-bold text-button font-['Figtree']">
            {t('nav.schedule')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification status indicator */}
          <div className="flex items-center gap-2 text-sm">
            <Bell className={`w-4 h-4 ${
              notificationPermission === 'granted' ? 'text-green-600' : 'text-yellow-600'
            }`} />
            <span className={notificationPermission === 'granted' ? 'text-green-600' : 'text-yellow-600'}>
              {notificationPermission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
            </span>
          </div>
          {/* SIMPLIFIED BUTTON */}
          <button 
            type="button"
            onClick={() => {
              console.log('Schedule Post clicked');
              setShowNewPostModal(true);
            }}
            className="px-4 py-2 rounded-lg flex items-center gap-2"
            style={{
              backgroundColor: '#2a4152',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus className="w-4 h-4" />
            Schedule Post
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 font-['Figtree']">Calendar</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Scheduled (2)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Published (1)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Failed (0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Posts */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 font-['Figtree']">Scheduled Posts</h2>
            <div className="space-y-4">
              {scheduledPosts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${getPlatformColor(post.platform)}`}>
                        {post.platform}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                        {post.status === 'reminder-sent' ? 'reminder sent' : post.status}
                      </span>
                      {post.status === 'scheduled' && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Bell className="w-3 h-3" />
                          <Mail className="w-3 h-3" />
                          <span>notifications set</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3 font-['Figtree']">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(post.scheduledTime).toLocaleString()}</span>
                    </div>
                    {post.status === 'scheduled' && (
                      <button 
                        onClick={() => handleSendNow(post)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send Reminder Now</span>
                      </button>
                    )}
                    {post.status === 'reminder-sent' && (
                      <a 
                        href={NotificationService.getPrefilledURL(post.platform, post.content)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:text-green-800"
                      >
                        <Send className="w-4 h-4" />
                        <span>Post Now</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal - THIS IS THE CRITICAL FIX */}
      {showNewPostModal && (
        <NewPostModal 
          onClose={() => setShowNewPostModal(false)}
          onSchedule={handleSchedulePost}
        />
      )}
    </div>
  );
};

// Simple modal component for creating new posts
const NewPostModal: React.FC<{
  onClose: () => void;
  onSchedule: (post: Omit<ScheduledPost, 'id' | 'status'>) => void;
}> = ({ onClose, onSchedule }) => {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('Twitter/X');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content && platform && scheduledTime) {
      onSchedule({
        content,
        platform,
        scheduledTime,
        userEmail: 'user@example.com' // Get from user context
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Schedule New Post</h3>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-button font-['Figtree']">
            Schedule Posts
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Bell className={`w-4 h-4 ${
                notificationPermission === 'granted' ? 'text-green-600' : 'text-yellow-600'
              }`} />
              <span className={notificationPermission === 'granted' ? 'text-green-600' : 'text-yellow-600'}>
                {notificationPermission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
              </span>
            </div>
            <div>
              <button 
                onClick={() => {
                  console.log('BUTTON CLICKED!');
                  alert('SUCCESS!');
                  setShowNewPostModal(true);
                }}
              >
                TEST BUTTON
              </button>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Platform</label>
            <select 
              value={platform} 
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="Twitter/X">Twitter/X</option>
              <option value="YouTube">YouTube</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded-lg h-24"
              placeholder="What do you want to post?"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Schedule Time</label>
            <input 
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-button text-white rounded-lg hover:bg-button-hover"
            >
              Schedule Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Schedule;