import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

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
    
    // MegaFilter
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
    
    // And many more...
  },
  fr: {
    // Navigation
    'nav.overview': 'Aperçu',
    'nav.analytics': 'Analytiques',
    'nav.content': 'Contenu',
    'nav.audience': 'Audience',
    'nav.trends': 'Tendances',
    'nav.trending': 'Contenu Tendance',
    'nav.schedule': 'Planification',
    'nav.settings': 'Paramètres',
    'nav.login': 'Connexion',
    'nav.logout': 'Déconnexion',
    
    // Platforms
    'platforms.all': 'Toutes Plateformes',
    
    // Dashboard
    'dashboard.title': 'Tendances Mondiales',
    'dashboard.search': 'Rechercher du contenu tendance...',
    'dashboard.filter.all': 'Toutes Plateformes',
    'dashboard.filter.youtube': 'YouTube',
    'dashboard.filter.tiktok': 'TikTok',
    'dashboard.filter.twitter': 'Twitter/X',
    'dashboard.filter.instagram': 'Instagram',
    
    // Content
    'content.views': 'vues',
    'content.likes': 'j\'aime',
    'content.comments': 'commentaires',
    'content.shares': 'partages',
    'content.trending': 'Tendance',
    'content.sentiment.positive': 'Positif',
    'content.sentiment.neutral': 'Neutre',
    'content.sentiment.negative': 'Négatif',
    
    // AI
    'ai.title': 'Assistant IA',
    'ai.placeholder': 'Demandez des tendances, analyses ou insights...',
    'ai.welcome': 'Salut! Je peux vous aider à analyser le contenu tendance et fournir des insights. Que voulez-vous savoir?',
    
    // Auth
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.signup': 'S\'inscrire',
    'auth.email': 'Adresse Email',
    'auth.otp': 'Entrer OTP',
    'auth.send_otp': 'Envoyer OTP',
    'auth.verify': 'Vérifier',
    'auth.optional': 'Connexion pour fonctionnalités avancées',
    
    // Profile
    'profile.notLoggedIn': 'Non Connecté',
    'profile.loginToView': 'Connectez-vous pour voir votre profil',
    
    // Common UI
    'ui.loading': 'Chargement...',
    'ui.save': 'Enregistrer',
    'ui.cancel': 'Annuler',
    'ui.delete': 'Supprimer',
    'ui.edit': 'Modifier',
    'ui.close': 'Fermer',
    'ui.search': 'Rechercher',
    'ui.filter': 'Filtrer',
    'ui.sort': 'Trier par',
    'ui.to': 'à',
    
    // Notifications
    'notifications.none': 'Aucune notification trouvée',
    'notifications.settings': 'Paramètres de notification',
    'notifications.email': 'Notifications par email',
    'notifications.push': 'Notifications push',
    'notifications.frequency': 'Fréquence',
    
    // Global Reach
    'globalreach.title': 'Portée Mondiale',
    'globalreach.map': 'Carte Interactive des Tendances Mondiales',
    'globalreach.engagement': 'Taux d\'Engagement',
    'globalreach.posts': 'Total des Publications',
    'globalreach.growth': 'Croissance',
    
    // Schedule
    'schedule.calendar': 'Calendrier',
    'schedule.posts': 'Publications Programmées',
    'schedule.new': 'Programmer Nouvelle Publication',
    'schedule.platform': 'Plateforme',
    'schedule.content': 'Contenu',
    'schedule.time': 'Heure de Programmation',
    
    // Settings
    'settings.profile': 'Paramètres de Profil',
    'settings.privacy': 'Paramètres de Confidentialité',
    'settings.security': 'Sécurité',
    'settings.theme': 'Thème',
    'settings.language': 'Langue',
    'settings.timezone': 'Fuseau Horaire',
    'settings.dateformat': 'Format de Date',
    'settings.fullname': 'Nom Complet',
    'settings.email': 'Email',
    'settings.bio': 'Bio',
    'settings.website': 'Site Web',
    'settings.password': 'Mot de Passe Actuel',
    'settings.avatar': 'Changer l\'Avatar',
    
    // MegaFilter
    'filter.platforms': 'Plateformes',
    'filter.categories': 'Catégories',
    'filter.sentiment': 'Sentiment',
    'filter.engagement': 'Plage d\'Engagement',
    'filter.engagement.rate': 'Taux d\'Engagement (%)',
    'filter.trending.score': 'Score de Tendance',
    'filter.followers': 'Nombre d\'Abonnés du Créateur',
    'filter.filters': 'Filtres',
    'filter.clear': 'Effacer tout',
    'filter.results': 'résultats',
    'filter.tabs.basic': 'Basique',
    'filter.tabs.advanced': 'Avancé',
    'filter.tabs.sorting': 'Tri',
    'ui.min': 'Min',
    'ui.max': 'Max',
    
    // Analytics
    'analytics.performance': 'Performance des Plateformes',
    'analytics.engagement': 'Engagement au Fil du Temps',
    'analytics.distribution': 'Distribution des Plateformes',
    'analytics.advanced': 'Analyses Avancées',
    'analytics.metrics': 'Métriques d\'Engagement Détaillées',
    'analytics.predictions': 'Prédictions de Croissance',
    'analytics.audience': 'Insights d\'Audience',
    
    // And many more...
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

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