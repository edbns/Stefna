export interface ScheduledPost {
  id: string;
  content: string;
  platform: string;
  scheduledTime: string;
  status: 'scheduled' | 'reminder-sent' | 'published' | 'failed';
  mediaUrl?: string;
  userEmail?: string;
}

export class NotificationService {
  private static scheduledReminders = new Map<string, NodeJS.Timeout>();

  // Schedule a reminder for a post
  static async scheduleReminder(post: ScheduledPost) {
    const scheduledTime = new Date(post.scheduledTime);
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay > 0) {
      // Schedule browser notification
      const timeoutId = setTimeout(() => {
        this.sendReminder(post);
      }, delay);
      
      this.scheduledReminders.set(post.id, timeoutId);
      
      // Also schedule email notification
      await this.scheduleEmailReminder(post, delay);
      
      console.log(`Reminder scheduled for ${post.platform} post at ${scheduledTime.toLocaleString()}`);
    } else {
      console.log('Scheduled time is in the past, sending reminder immediately');
      await this.sendReminder(post);
    }
  }

  // Send the actual reminder
  static async sendReminder(post: ScheduledPost) {
    try {
      // Send browser notification
      await this.showBrowserNotification(post);
      
      // Send email notification
      await this.sendEmailNotification(post);
      
      // Update post status
      this.updatePostStatus(post.id, 'reminder-sent');
      
      // Clean up scheduled reminder
      this.scheduledReminders.delete(post.id);
      
      console.log(`Reminder sent for ${post.platform} post: ${post.content.substring(0, 50)}...`);
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  }

  // Browser notification
  static async showBrowserNotification(post: ScheduledPost) {
    // Request permission if not granted
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      if (Notification.permission === 'granted') {
        const notification = new Notification(`🚀 Time to post on ${post.platform}!`, {
          body: `"${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`,
          icon: `/icons/${post.platform.toLowerCase().replace('/', '-')}.png`,
          tag: post.id,
          requireInteraction: true,
          actions: [
            { action: 'open-platform', title: `Open ${post.platform}` },
            { action: 'copy-content', title: 'Copy Content' }
          ]
        });

        notification.onclick = () => {
          window.focus();
          window.open(this.getPlatformURL(post.platform), '_blank');
          this.copyToClipboard(post.content);
        };

        // Auto-close after 30 seconds
        setTimeout(() => notification.close(), 30000);
      }
    }
  }

  // Email notification
  static async sendEmailNotification(post: ScheduledPost) {
    try {
      const emailData = {
        to: post.userEmail || 'user@example.com', // You'll get this from user context
        subject: `⏰ Time to post on ${post.platform}!`,
        html: this.generateEmailTemplate(post)
      };

      // In a real app, you'd send this to your backend API
      // For now, we'll simulate the email
      console.log('Email notification sent:', emailData);
      
      // Uncomment when you have a backend API
      /*
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }
      */
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  // Generate email template
  static generateEmailTemplate(post: ScheduledPost): string {
    const platformURL = this.getPlatformURL(post.platform);
    const prefilledURL = this.getPrefilledURL(post.platform, post.content);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .post-content { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4F46E5; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .button:hover { background: #3730A3; }
          .platform { color: #4F46E5; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Time to Post!</h1>
            <p>Your scheduled <span class="platform">${post.platform}</span> post is ready</p>
          </div>
          <div class="content">
            <div class="post-content">
              <h3>📝 Your Content:</h3>
              <p><em>"${post.content}"</em></p>
              ${post.mediaUrl ? `<p>📎 <strong>Media:</strong> <a href="${post.mediaUrl}">Download attachment</a></p>` : ''}
            </div>
            
            <h3>🎯 Quick Actions:</h3>
            <a href="${prefilledURL}" class="button">📝 Post with Pre-filled Content</a>
            <a href="${platformURL}" class="button">🌐 Open ${post.platform}</a>
            
            <h3>💡 Tips for ${post.platform}:</h3>
            ${this.getPlatformTips(post.platform)}
            
            <p><small>Scheduled for: ${new Date(post.scheduledTime).toLocaleString()}</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Get platform-specific URLs
  static getPlatformURL(platform: string): string {
    const urls: Record<string, string> = {
      'YouTube': 'https://studio.youtube.com/channel/UC/videos/upload',
      'Twitter/X': 'https://twitter.com/compose/tweet',
      'Instagram': 'https://www.instagram.com/',
      'TikTok': 'https://www.tiktok.com/upload',
      'LinkedIn': 'https://www.linkedin.com/sharing/share-offsite/',
      'Facebook': 'https://www.facebook.com/'
    };
    return urls[platform] || '#';
  }

  // Get pre-filled posting URLs
  static getPrefilledURL(platform: string, content: string): string {
    const encodedContent = encodeURIComponent(content);
    
    switch (platform) {
      case 'Twitter/X':
        return `https://twitter.com/intent/tweet?text=${encodedContent}`;
      case 'LinkedIn':
        return `https://www.linkedin.com/sharing/share-offsite/?summary=${encodedContent}`;
      case 'Facebook':
        return `https://www.facebook.com/sharer/sharer.php?quote=${encodedContent}`;
      default:
        return this.getPlatformURL(platform);
    }
  }

  // Platform-specific tips
  static getPlatformTips(platform: string): string {
    const tips: Record<string, string> = {
      'YouTube': '<ul><li>📊 Check your analytics for optimal upload time</li><li>🏷️ Use relevant tags and categories</li><li>👁️ Create an eye-catching thumbnail</li></ul>',
      'Twitter/X': '<ul><li>🔗 Include relevant hashtags</li><li>📸 Add images for better engagement</li><li>🧵 Consider creating a thread for longer content</li></ul>',
      'Instagram': '<ul><li>📱 Use high-quality images</li><li>#️⃣ Include 5-10 relevant hashtags</li><li>📍 Add location tags if relevant</li></ul>',
      'TikTok': '<ul><li>🎵 Choose trending audio</li><li>⏰ Keep videos under 60 seconds for better reach</li><li>🔥 Use trending hashtags</li></ul>'
    };
    return tips[platform] || '<p>Make sure your content follows the platform\'s guidelines!</p>';
  }

  // Utility functions
  static async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Content copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  static updatePostStatus(postId: string, status: ScheduledPost['status']) {
    // In a real app, this would update your database
    console.log(`Post ${postId} status updated to: ${status}`);
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('postStatusUpdate', {
      detail: { postId, status }
    }));
  }

  static cancelReminder(postId: string) {
    const timeoutId = this.scheduledReminders.get(postId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledReminders.delete(postId);
      console.log(`Reminder cancelled for post ${postId}`);
    }
  }

  // Schedule email reminder (for when browser is closed)
  static async scheduleEmailReminder(post: ScheduledPost, delay: number) {
    // In a real app, you'd send this to your backend to schedule the email
    console.log(`Email reminder scheduled for ${new Date(Date.now() + delay).toLocaleString()}`);
    
    // Uncomment when you have a backend API
    /*
    await fetch('/api/notifications/schedule-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: post.id,
        scheduledTime: post.scheduledTime,
        userEmail: post.userEmail,
        content: post.content,
        platform: post.platform
      })
    });
    */
  }
}