export interface Photo {
  id: string;
  originalUrl: string;
  processedUrl?: string;
  thumbnail?: string;
  createdAt: Date;
}

export interface PromptRecipe {
  id: string;
  name: string;
  prompt: string;
  description?: string;
  imageUrl: string;
  originalImageUrl: string;
  authorId?: string;
  authorName?: string;
  likes: number;
  isLiked: boolean;
  isFavorited: boolean;
  createdAt: Date;
  tags?: string[];
}

export interface AIFilter {
  id: string;
  name: string;
  prompt: string;
  description: string;
  category: string;
  previewImage?: string;
  isPopular?: boolean;
}

export interface UserQuota {
  dailyLimit: number;
  used: number;
  resetTime: Date;
  bonusTokens: number;
}

export interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalImageUrl: string;
  prompt: string;
  resultUrl?: string;
  progress?: number;
  error?: string;
  createdAt: Date;
}

export type Screen = 'camera' | 'edit' | 'feed';

export interface AppState {
  currentScreen: Screen;
  currentPhoto?: Photo;
  userQuota: UserQuota;
  favoritePrompts: string[];
}