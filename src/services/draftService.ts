import { authenticatedFetch } from '../utils/apiClient';

export interface UserDraft {
  id: number;
  user_id: string;
  media_url: string;
  prompt: string;
  media_type: 'photo' | 'video';
  aspect_ratio: number;
  width: number;
  height: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateDraftData {
  media_url: string;
  prompt: string;
  media_type: 'photo' | 'video';
  aspect_ratio?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

export interface UpdateDraftData extends Partial<CreateDraftData> {
  id: number;
}

class DraftService {
  private static instance: DraftService;

  private constructor() {}

  static getInstance(): DraftService {
    if (!DraftService.instance) {
      DraftService.instance = new DraftService();
    }
    return DraftService.instance;
  }

  async getUserDrafts(limit: number = 50, offset: number = 0): Promise<{ drafts: UserDraft[]; total: number }> {
    try {
      const response = await authenticatedFetch(`/api/user-drafts?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }

      const data = await response.json();
      return {
        drafts: data.drafts || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Failed to fetch user drafts:', error);
      throw error;
    }
  }

  async saveDraft(draftData: CreateDraftData): Promise<UserDraft> {
    try {
      const response = await authenticatedFetch('/api/user-drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save draft: ${response.status}`);
      }

      const data = await response.json();
      return data.draft;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }

  async updateDraft(draftData: UpdateDraftData): Promise<UserDraft> {
    try {
      const response = await authenticatedFetch('/api/user-drafts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update draft: ${response.status}`);
      }

      const data = await response.json();
      return data.draft;
    } catch (error) {
      console.error('Failed to update draft:', error);
      throw error;
    }
  }

  async deleteDraft(draftId: number): Promise<void> {
    try {
      const response = await authenticatedFetch(`/api/user-drafts?id=${draftId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete draft: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw error;
    }
  }
}

export default DraftService.getInstance();
