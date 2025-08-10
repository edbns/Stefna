// Centralized service for handling media interactions (likes, shares, remixes)
// This ensures all interaction data is consistent across the application

export interface InteractionResponse {
  success: boolean
  action: string
  likeCount?: number
  shareCount?: number
  remixCount?: number
  isLiked?: boolean
  error?: string
}

class InteractionService {
  private baseUrl = '/.netlify/functions'

  // Toggle like on media
  async toggleLike(mediaId: string): Promise<InteractionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/toggleLike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('stefna_jwt') || ''}`
        },
        body: JSON.stringify({ mediaId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle like')
      }

      const result = await response.json()
      return {
        success: true,
        action: result.action,
        likeCount: result.likeCount,
        isLiked: result.isLiked
      }
    } catch (error) {
      console.error('Toggle like error:', error)
      return {
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Record a share of media
  async recordShare(mediaId: string, shareType: 'public' | 'social' | 'link' = 'public'): Promise<InteractionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/recordShare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('stefna_jwt') || ''}`
        },
        body: JSON.stringify({ mediaId, shareType })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to record share')
      }

      const result = await response.json()
      return {
        success: true,
        action: result.action,
        shareCount: result.shareCount
      }
    } catch (error) {
      console.error('Record share error:', error)
      return {
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get interaction counts for media
  async getInteractionCounts(mediaId: string): Promise<{
    likes: number
    remixes: number
    shares: number
  }> {
    try {
      // This would typically call a dedicated endpoint, but for now we'll return defaults
      // In a full implementation, you'd have a getMediaStats endpoint
      return {
        likes: 0,
        remixes: 0,
        shares: 0
      }
    } catch (error) {
      console.error('Get interaction counts error:', error)
      return {
        likes: 0,
        remixes: 0,
        shares: 0
      }
    }
  }

  // Check if current user has interacted with media
  async getUserInteractions(mediaId: string): Promise<{
    hasLiked: boolean
    hasRemixed: boolean
    hasShared: boolean
  }> {
    try {
      // This would typically call a dedicated endpoint to check user's interactions
      // For now, we'll return defaults based on local storage or other state
      return {
        hasLiked: false,
        hasRemixed: false,
        hasShared: false
      }
    } catch (error) {
      console.error('Get user interactions error:', error)
      return {
        hasLiked: false,
        hasRemixed: false,
        hasShared: false
      }
    }
  }

  // Update local state after successful interaction
  updateLocalCounts(
    mediaId: string,
    type: 'like' | 'share' | 'remix',
    action: 'add' | 'remove',
    currentCounts: Record<string, number>
  ): Record<string, number> {
    const newCounts = { ...currentCounts }
    
    if (type === 'like') {
      if (action === 'add') {
        newCounts[`${mediaId}_likes`] = (newCounts[`${mediaId}_likes`] || 0) + 1
      } else {
        newCounts[`${mediaId}_likes`] = Math.max(0, (newCounts[`${mediaId}_likes`] || 0) - 1)
      }
    } else if (type === 'share') {
      if (action === 'add') {
        newCounts[`${mediaId}_shares`] = (newCounts[`${mediaId}_shares`] || 0) + 1
      }
    } else if (type === 'remix') {
      if (action === 'add') {
        newCounts[`${mediaId}_remixes`] = (newCounts[`${mediaId}_remixes`] || 0) + 1
      }
    }
    
    return newCounts
  }
}

// Export singleton instance
export const interactionService = new InteractionService()
export default interactionService
