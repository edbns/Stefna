export const mockPosts = [
  {
    id: 1,
    platform: 'youtube',
    title: 'Amazing AI Breakthrough That Will Change Everything!',
    thumbnail: 'https://picsum.photos/400/225?random=1',
    views: 2547892,
    url: 'https://youtube.com/watch?v=example1',
    aiSummary: 'This video discusses recent advances in artificial intelligence, focusing on new transformer models and their potential impact on various industries.',
    creator: 'TechExplorer',
    duration: '12:34',
    publishedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: 2,
    platform: 'tiktok',
    title: 'Mind-blowing Life Hack Everyone Should Know',
    thumbnail: 'https://picsum.photos/400/500?random=2',
    views: 8932156,
    url: 'https://tiktok.com/@user/video/example2',
    aiSummary: 'A creative life hack showing how to organize your workspace using everyday items in an innovative way.',
    creator: '@LifeHackQueen',
    duration: '0:47',
    publishedAt: '2024-01-20T15:45:00Z'
  },
  {
    id: 3,
    platform: 'youtube',
    title: 'The Future of Electric Vehicles Explained',
    thumbnail: 'https://picsum.photos/400/225?random=3',
    views: 1234567,
    url: 'https://youtube.com/watch?v=example3',
    aiSummary: 'Comprehensive overview of electric vehicle technology, battery innovations, and market predictions for the next decade.',
    creator: 'EV Channel',
    duration: '18:22',
    publishedAt: '2024-01-20T08:15:00Z'
  },
  {
    id: 4,
    platform: 'tiktok',
    title: 'Viral Dance Challenge Taking Over Social Media',
    thumbnail: 'https://picsum.photos/400/500?random=4',
    views: 15678903,
    url: 'https://tiktok.com/@user/video/example4',
    aiSummary: 'A new dance trend that combines elements from hip-hop and contemporary dance, rapidly gaining popularity among young creators.',
    creator: '@DanceVibes',
    duration: '0:32',
    publishedAt: '2024-01-20T20:12:00Z'
  },
  {
    id: 5,
    platform: 'youtube',
    title: 'Cooking the Perfect Pasta - Italian Chef Secrets',
    thumbnail: 'https://picsum.photos/400/225?random=5',
    views: 892344,
    url: 'https://youtube.com/watch?v=example5',
    aiSummary: 'Professional Italian chef shares traditional techniques for making perfect pasta, including dough preparation and sauce pairing.',
    creator: 'Chef Marco',
    duration: '15:09',
    publishedAt: '2024-01-20T12:00:00Z'
  },
  {
    id: 6,
    platform: 'tiktok',
    title: 'Quick Morning Routine for Productivity',
    thumbnail: 'https://picsum.photos/400/500?random=6',
    views: 3456789,
    url: 'https://tiktok.com/@user/video/example6',
    aiSummary: 'Efficient morning routine tips focusing on time management, healthy habits, and productivity boosting techniques.',
    creator: '@ProductivityPro',
    duration: '1:12',
    publishedAt: '2024-01-20T06:30:00Z'
  },
  {
    id: 7,
    platform: 'youtube',
    title: 'Space Exploration: Journey to Mars',
    thumbnail: 'https://picsum.photos/400/225?random=7',
    views: 3421890,
    url: 'https://youtube.com/watch?v=example7',
    aiSummary: 'Documentary-style exploration of current Mars mission plans, technological challenges, and timeline predictions.',
    creator: 'Space Documentary',
    duration: '28:45',
    publishedAt: '2024-01-19T16:20:00Z'
  },
  {
    id: 8,
    platform: 'tiktok',
    title: 'Fashion Trend Alert: Sustainable Style',
    thumbnail: 'https://picsum.photos/400/500?random=8',
    views: 2187654,
    url: 'https://tiktok.com/@user/video/example8',
    aiSummary: 'Latest sustainable fashion trends focusing on eco-friendly materials and ethical manufacturing practices.',
    creator: '@EcoFashion',
    duration: '0:56',
    publishedAt: '2024-01-19T14:45:00Z'
  }
];

// Function to simulate infinite scroll - returns more posts
export const getMorePosts = (offset = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPosts = mockPosts.map((post, index) => ({
        ...post,
        id: post.id + offset,
        title: `${post.title} (Page ${Math.floor(offset / 8) + 1})`,
        views: post.views + Math.floor(Math.random() * 100000)
      }));
      resolve(newPosts);
    }, 1000);
  });
};