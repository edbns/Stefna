import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.overview': 'Overview',
    'nav.analytics': 'Analytics',
    'nav.content': 'Content',
    'nav.audience': 'Audience',
    'nav.trends': 'Trends',
    'nav.trending': 'Trending Content',
    'nav.schedule': 'Schedule',
    'nav.settings': 'Settings',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    
    // Platforms
    'platforms.all': 'All Platforms',
    
    // Dashboard
    'dashboard.title': 'Trending Worldwide',
    'dashboard.search': 'Search trending content...',
    'dashboard.filter.all': 'All Platforms',
    'dashboard.filter.youtube': 'YouTube',
    'dashboard.filter.tiktok': 'TikTok',
    'dashboard.filter.twitter': 'Twitter/X',
    'dashboard.filter.instagram': 'Instagram',
    
    // Content
    'content.views': 'views',
    'content.likes': 'likes',
    'content.comments': 'comments',
    'content.shares': 'shares',
    'content.trending': 'Trending',
    'content.sentiment.positive': 'Positive',
    'content.sentiment.neutral': 'Neutral',
    'content.sentiment.negative': 'Negative',
    
    // AI
    'ai.title': 'AI Assistant',
    'ai.placeholder': 'Ask about trends, analytics, or insights...',
    'ai.welcome': 'Hi! I can help you analyze trending content and provide insights. What would you like to know?',
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email Address',
    'auth.otp': 'Enter OTP',
    'auth.send_otp': 'Send OTP',
    'auth.verify': 'Verify',
    'auth.optional': 'Login for advanced features',
    
    // Profile
    'profile.notLoggedIn': 'Not Logged In',
    'profile.loginToView': 'Login to view your profile',
    
    // Common UI
    'ui.loading': 'Loading...',
    'ui.save': 'Save',
    'ui.cancel': 'Cancel',
    'ui.delete': 'Delete',
    'ui.edit': 'Edit',
    'ui.close': 'Close',
    'ui.search': 'Search',
    'ui.filter': 'Filter',
    'ui.sort': 'Sort By',
    'ui.to': 'to',
    
    // Notifications
    'notifications.none': 'No notifications found',
    'notifications.settings': 'Notification Settings',
    'notifications.email': 'Email Notifications',
    'notifications.push': 'Push Notifications',
    'notifications.frequency': 'Frequency',
    
    // Global Reach
    'globalreach.title': 'Global Reach',
    'globalreach.map': 'Interactive Global Trending Map',
    'globalreach.engagement': 'Engagement Rate',
    'globalreach.posts': 'Total Posts',
    'globalreach.growth': 'Growth',
    
    // Schedule
    'schedule.calendar': 'Calendar',
    'schedule.posts': 'Scheduled Posts',
    'schedule.new': 'Schedule New Post',
    'schedule.platform': 'Platform',
    'schedule.content': 'Content',
    'schedule.time': 'Schedule Time',
    
    // Settings
    'settings.profile': 'Profile Settings',
    'settings.privacy': 'Privacy Settings',
    'settings.security': 'Security',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.timezone': 'Timezone',
    'settings.dateformat': 'Date Format',
    'settings.fullname': 'Full Name',
    'settings.email': 'Email',
    'settings.bio': 'Bio',
    'settings.website': 'Website',
    'settings.password': 'Current Password',
    'settings.avatar': 'Change Avatar',
    
    // FloatingFilter
    'filter.platforms': 'Platforms',
    'filter.categories': 'Categories',
    'filter.sentiment': 'Sentiment',
    'filter.engagement': 'Engagement Range',
    'filter.engagement.rate': 'Engagement Rate (%)',
    'filter.trending.score': 'Trending Score',
    'filter.followers': 'Creator Follower Count',
    'filter.filters': 'Filters',
    
    // Analytics
    'analytics.performance': 'Platform Performance',
    'analytics.engagement': 'Engagement Over Time',
    'analytics.distribution': 'Platform Distribution',
    'analytics.advanced': 'Advanced Analytics',
    'analytics.metrics': 'Detailed Engagement Metrics',
    'analytics.predictions': 'Growth Predictions',
    'analytics.audience': 'Audience Insights',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations['en']];
    return translation || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};