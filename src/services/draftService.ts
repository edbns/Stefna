// src/services/draftService.ts
// Service for managing user drafts

import { authenticatedFetch } from '../utils/apiClient';
import { UserMedia } from './userMediaService';

export interface DraftData {
  media_url: string;
  prompt: string;
  media_type: 'photo' | 'video';
  aspect_ratio?: number;
  width?: number;
  height?: number;
  metadata?: any;
}

export interface Draft extends UserMedia {
  isDraft: true;
  createdAt: string;
  updatedAt: string;
}

class DraftService {
  /**
   * Save a draft to the database
   */
  async saveDraft(draftData: DraftData): Promise<Draft> {
    try {
      const response = await authenticatedFetch('/.netlify/functions/user-drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(draftData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save draft: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result.draft;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  /**
   * Get all drafts for the current user
   */
  async getUserDrafts(): Promise<Draft[]> {
    try {
      const response = await authenticatedFetch('/.netlify/functions/getUserDrafts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get drafts: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result.drafts || [];
    } catch (error) {
      console.error('Error getting drafts:', error);
      throw error;
    }
  }

  /**
   * Update an existing draft
   */
  async updateDraft(draftId: string, draftData: Partial<DraftData>): Promise<Draft> {
    try {
      const response = await authenticatedFetch('/.netlify/functions/user-drafts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: draftId,
          ...draftData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update draft: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result.draft;
    } catch (error) {
      console.error('Error updating draft:', error);
      throw error;
    }
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    try {
      const response = await authenticatedFetch('/.netlify/functions/user-drafts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: draftId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete draft: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }
}

export default new DraftService();