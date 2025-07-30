export interface UserInteraction {
  id: string;
  type: 'like' | 'follow';
  contentType: 'music' | 'youtube' | 'reddit' | 'news' | 'crypto' | 'creator';
  contentId: string;
  timestamp: number;
  metadata?: any;
}

export interface InteractionStats {
  likes: number;
  follows: number;
  isLiked: boolean;
  isFollowed: boolean;
}

class UserInteractionService {
  private static instance: UserInteractionService;
  private interactions: UserInteraction[] = [];
  private readonly STORAGE_KEY = 'stefna_user_interactions';

  public static getInstance(): UserInteractionService {
    if (!UserInteractionService.instance) {
      UserInteractionService.instance = new UserInteractionService();
    }
    return UserInteractionService.instance;
  }

  constructor() {
    this.loadInteractions();
  }

  private loadInteractions(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.interactions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading interactions:', error);
      this.interactions = [];
    }
  }

  private saveInteractions(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.interactions));
    } catch (error) {
      console.error('Error saving interactions:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  like(contentType: string, contentId: string, metadata?: any): boolean {
    const existingIndex = this.interactions.findIndex(
      i => i.type === 'like' && i.contentType === contentType && i.contentId === contentId
    );

    if (existingIndex >= 0) {
      // Unlike
      this.interactions.splice(existingIndex, 1);
      this.saveInteractions();
      return false;
    } else {
      // Like
      const interaction: UserInteraction = {
        id: this.generateId(),
        type: 'like',
        contentType: contentType as any,
        contentId,
        timestamp: Date.now(),
        metadata
      };
      this.interactions.push(interaction);
      this.saveInteractions();
      return true;
    }
  }

  follow(contentType: string, contentId: string, metadata?: any): boolean {
    const existingIndex = this.interactions.findIndex(
      i => i.type === 'follow' && i.contentType === contentType && i.contentId === contentId
    );

    if (existingIndex >= 0) {
      // Unfollow
      this.interactions.splice(existingIndex, 1);
      this.saveInteractions();
      return false;
    } else {
      // Follow
      const interaction: UserInteraction = {
        id: this.generateId(),
        type: 'follow',
        contentType: contentType as any,
        contentId,
        timestamp: Date.now(),
        metadata
      };
      this.interactions.push(interaction);
      this.saveInteractions();
      return true;
    }
  }

  isLiked(contentType: string, contentId: string): boolean {
    return this.interactions.some(
      i => i.type === 'like' && i.contentType === contentType && i.contentId === contentId
    );
  }

  isFollowed(contentType: string, contentId: string): boolean {
    return this.interactions.some(
      i => i.type === 'follow' && i.contentType === contentType && i.contentId === contentId
    );
  }

  getStats(contentType: string, contentId: string): InteractionStats {
    const likes = this.interactions.filter(
      i => i.type === 'like' && i.contentType === contentType && i.contentId === contentId
    ).length;
    
    const follows = this.interactions.filter(
      i => i.type === 'follow' && i.contentType === contentType && i.contentId === contentId
    ).length;

    return {
      likes,
      follows,
      isLiked: this.isLiked(contentType, contentId),
      isFollowed: this.isFollowed(contentType, contentId)
    };
  }

  getUserInteractions(): UserInteraction[] {
    return [...this.interactions];
  }

  clearInteractions(): void {
    this.interactions = [];
    this.saveInteractions();
  }
}

export default UserInteractionService.getInstance(); 