export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  dailyLimit?: number;
  weeklyLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  mediaUploadAgreed: boolean;
  shareToFeed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredits {
  userId: string;
  credits: number;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}
