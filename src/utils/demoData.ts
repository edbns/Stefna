import { PromptRecipe } from '../types';

// Demo prompt recipes for the feed
export const demoPrompts: PromptRecipe[] = [
  {
    id: 'demo_1',
    name: 'Dreamy Ghibli Forest',
    prompt: 'in the style of studio ghibli, magical forest, dreamy atmosphere, soft lighting, anime style, cel shading',
    description: 'Transform any photo into a magical Studio Ghibli forest scene',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
    originalImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
    authorName: 'ArtMaster',
    likes: 1247,
    isLiked: false,
    isFavorited: false,
    createdAt: new Date('2024-01-15'),
    tags: ['anime', 'ghibli', 'forest', 'magical']
  },
  {
    id: 'demo_2',
    name: 'Neon Cyberpunk Vibes',
    prompt: 'cyberpunk style, neon lights, futuristic cityscape, purple and blue tones, synthwave aesthetic, digital art',
    description: 'Give your photos that electric cyberpunk atmosphere',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
    originalImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
    authorName: 'CyberArt',
    likes: 892,
    isLiked: true,
    isFavorited: false,
    createdAt: new Date('2024-01-14'),
    tags: ['cyberpunk', 'neon', 'futuristic', 'synthwave']
  },
  {
    id: 'demo_3',
    name: 'Vintage Oil Painting',
    prompt: 'classical oil painting, renaissance style, warm golden tones, detailed brushstrokes, museum quality art',
    description: 'Transform your photo into a timeless oil painting masterpiece',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    originalImageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    authorName: 'ClassicArt',
    likes: 654,
    isLiked: false,
    isFavorited: true,
    createdAt: new Date('2024-01-13'),
    tags: ['oil painting', 'classical', 'renaissance', 'artistic']
  },
  {
    id: 'demo_4',
    name: 'Kawaii Anime Style',
    prompt: 'kawaii anime style, pastel colors, cute and cheerful, manga illustration, soft shading, adorable',
    description: 'Make any photo super cute with kawaii anime styling',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    originalImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    authorName: 'KawaiiCreator',
    likes: 1589,
    isLiked: false,
    isFavorited: false,
    createdAt: new Date('2024-01-12'),
    tags: ['anime', 'kawaii', 'cute', 'pastel', 'manga']
  },
  {
    id: 'demo_5',
    name: 'Watercolor Dreams',
    prompt: 'watercolor painting, soft pastel colors, artistic brushstrokes, dreamy and ethereal, hand-painted feel',
    description: 'Create beautiful watercolor artwork from your photos',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    originalImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    authorName: 'WatercolorWiz',
    likes: 743,
    isLiked: true,
    isFavorited: true,
    createdAt: new Date('2024-01-11'),
    tags: ['watercolor', 'pastel', 'artistic', 'dreamy']
  },
  {
    id: 'demo_6',
    name: 'Comic Book Hero',
    prompt: 'comic book style, bold colors, dramatic lighting, superhero aesthetic, pop art, graphic novel illustration',
    description: 'Turn yourself into a comic book superhero',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    originalImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    authorName: 'ComicFan',
    likes: 1101,
    isLiked: false,
    isFavorited: false,
    createdAt: new Date('2024-01-10'),
    tags: ['comic', 'superhero', 'pop art', 'dramatic']
  }
];

// Helper function to initialize demo data in localStorage
export const initializeDemoData = () => {
  const existingFeed = localStorage.getItem('ai_photo_app_feed');
  if (!existingFeed) {
    localStorage.setItem('ai_photo_app_feed', JSON.stringify(demoPrompts));
  }
};