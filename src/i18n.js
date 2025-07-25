import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      title: 'SpyDash',
      subtitle: 'Social Trends',
      filter: {
        all: 'All',
        youtube: 'YouTube',
        tiktok: 'TikTok'
      },
      post: {
        views: 'views',
        aiInsight: 'AI Insight',
        watchNow: 'Watch Now',
        loadMore: 'Loading insights...'
      },
      language: {
        en: 'English',
        fr: 'Français'
      },
      sidebar: {
        dashboard: 'Dashboard',
        trending: 'Trending',
        youtube: 'YouTube',
        tiktok: 'TikTok',
        settings: 'Settings',
        search: 'Search',
        platforms: 'Platforms',
        region: 'Region'
      },
      countries: {
        worldwide: 'Worldwide',
        US: 'United States',
        GB: 'United Kingdom', 
        CA: 'Canada',
        AU: 'Australia',
        FR: 'France',
        DE: 'Germany',
        IT: 'Italy',
        ES: 'Spain',
        NL: 'Netherlands',
        RU: 'Russie',
        BR: 'Brazil',
        MX: 'Mexico',
        AR: 'Argentina',
        JP: 'Japan',
        KR: 'South Korea',
        CN: 'China',
        IN: 'India',
        SA: 'Saudi Arabia',
        AE: 'UAE',
        EG: 'Egypt',
        MA: 'Morocco',
        DZ: 'Algeria',
        TN: 'Tunisia',
        JO: 'Jordan',
        LB: 'Lebanon'
      }
    }
  },
  fr: {
    translation: {
      title: 'SpyDash',
      subtitle: 'Tendances Sociales',
      filter: {
        all: 'Tout',
        youtube: 'YouTube',
        tiktok: 'TikTok'
      },
      post: {
        views: 'vues',
        aiInsight: 'Aperçu IA',
        watchNow: 'Regarder',
        loadMore: 'Chargement des insights...'
      },
      language: {
        en: 'English',
        fr: 'Français'
      },
      sidebar: {
        dashboard: 'Tableau de bord',
        trending: 'Tendances',
        youtube: 'YouTube',
        tiktok: 'TikTok',
        settings: 'Paramètres',
        search: 'Rechercher',
        platforms: 'Plateformes',
        region: 'Région'
      },
      countries: {
        worldwide: 'Mondial',
        US: 'États-Unis',
        GB: 'Royaume-Uni',
        CA: 'Canada',
        AU: 'Australie',
        FR: 'France',
        DE: 'Allemagne',
        IT: 'Italie',
        ES: 'Espagne',
        NL: 'Pays-Bas',
        RU: 'Russie',
        BR: 'Brésil',
        MX: 'Mexique',
        AR: 'Argentine',
        JP: 'Japon',
        KR: 'Corée du Sud',
        CN: 'Chine',
        IN: 'Inde',
        SA: 'Arabie Saoudite',
        AE: 'Émirats Arabes Unis',
        EG: 'Égypte',
        MA: 'Maroc',
        DZ: 'Algérie',
        TN: 'Tunisie',
        JO: 'Jordanie',
        LB: 'Liban'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

// Handle language changes and update document attributes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  // Remove RTL direction since we're removing Arabic
  document.documentElement.dir = 'ltr';
});

// Set initial language and direction
document.documentElement.lang = i18n.language;
document.documentElement.dir = 'ltr';

export default i18n;