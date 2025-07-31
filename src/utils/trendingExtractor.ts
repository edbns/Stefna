export interface TrendingItem {
  name: string;
  count: number;
  platform: string;
  lastSeen: string;
}

export function normalizeHashtag(tag: string): string {
  return tag.replace(/^#/, '').toLowerCase().trim();
}

export function normalizeCategory(category: string): string {
  return category.trim().replace(/\b\w/g, l => l.toUpperCase());
}

export function extractTrends(items: any[], platform: string) {
  const hashtags: Record<string, number> = {};
  const categories: Record<string, number> = {};

  items.forEach(item => {
    // Extract hashtags from various fields
    const hashtagFields = [
      item.hashtags,
      item.tags,
      item.topics,
      item.keywords
    ].filter(Boolean);

    hashtagFields.forEach(field => {
      if (Array.isArray(field)) {
        field.forEach(tag => {
          const normalized = normalizeHashtag(tag);
          if (normalized) {
            hashtags[normalized] = (hashtags[normalized] || 0) + 1;
          }
        });
      }
    });

    // Extract categories from various fields
    const categoryFields = [
      item.category,
      item.genre,
      item.section,
      item.topic,
      item.type
    ].filter(Boolean);

    categoryFields.forEach(field => {
      if (typeof field === 'string') {
        const normalized = normalizeCategory(field);
        if (normalized) {
          categories[normalized] = (categories[normalized] || 0) + 1;
        }
      }
    });

    // Special handling for Hacker News - extract categories from titles and domains
    if (platform === 'hackernews') {
      // Extract potential categories from title
      if (item.title) {
        const titleWords = item.title.toLowerCase().split(' ');
        const techCategories = [
          'javascript', 'python', 'react', 'vue', 'angular', 'node', 'typescript',
          'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'machine learning', 'ai',
          'blockchain', 'crypto', 'web3', 'api', 'database', 'sql', 'nosql',
          'mobile', 'ios', 'android', 'flutter', 'react native', 'security',
          'privacy', 'performance', 'testing', 'ci/cd', 'devops', 'cloud',
          'serverless', 'microservices', 'architecture', 'design patterns'
        ];

        techCategories.forEach(category => {
          if (titleWords.some(word => word.includes(category.replace(' ', '')))) {
            const normalized = normalizeCategory(category);
            categories[normalized] = (categories[normalized] || 0) + 1;
          }
        });
      }

      // Extract domain as category
      if (item.url) {
        try {
          const domain = new URL(item.url).hostname.replace('www.', '');
          const domainParts = domain.split('.');
          if (domainParts.length >= 2) {
            const mainDomain = domainParts[domainParts.length - 2];
            const normalized = normalizeCategory(mainDomain);
            categories[normalized] = (categories[normalized] || 0) + 1;
          }
        } catch {
          // Invalid URL, skip
        }
      }
    }
  });

  const now = new Date().toISOString();

  return {
    hashtags: Object.entries(hashtags).map(([name, count]) => ({
      name,
      count,
      platform,
      lastSeen: now,
    })),
    categories: Object.entries(categories).map(([name, count]) => ({
      name,
      count,
      platform,
      lastSeen: now,
    })),
  };
} 