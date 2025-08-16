// User Service - Handles user data through Netlify Functions with Neon backend

export interface User {
  id: string
  name: string
  email?: string
  avatar?: string
  joinDate: string
  totalPhotos: number
  savedPrompts: SavedPrompt[]
  dailyUsage: number
  dailyLimit: number
}

export interface SavedPrompt {
  id: string
  prompt: string
  style: string
  createdAt: string
  usageCount: number
}

class UserService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.DEV 
      ? 'http://localhost:8888/.netlify/functions'
      : '/.netlify/functions'
  }

  // Get user data from our existing Netlify Function
  async getUserData(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/get-user-profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Failed to get user data:', response.statusText)
        return null
      }

      const data = await response.json()
      const profile = data.ok && data.profile ? data.profile : data;
      return this.transformUser(profile)
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }

  // Transform user data to our User interface
  private transformUser(userData: any): User {
    return {
      id: userData.id,
      name: userData.name || userData.username || userData.email?.split('@')[0] || 'User',
      email: userData.email,
      avatar: userData.avatar || userData.avatar_url,
      joinDate: userData.created_at || userData.createdAt,
      totalPhotos: userData.total_photos || 0,
      savedPrompts: userData.saved_prompts || [],
      dailyUsage: userData.daily_usage || 0,
      dailyLimit: this.getDailyLimit(userData.tier)
    }
  }

  // Get daily limit based on user tier
  private getDailyLimit(tier: string): number {
    switch (tier) {
      case 'guest': return 5
      case 'registered': return 15
      case 'verified': return 30
      case 'contributor': return 50
      default: return 10
    }
  }

  // Update user profile using our existing function
  async updateProfile(token: string, updates: Partial<User>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/update-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: updates.name,
          avatar_url: updates.avatar
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error updating profile:', error)
      return false
    }
  }

  // Get user statistics using our existing function
  async getUserStats(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/usage-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return null
    }
  }

  // Save prompt (placeholder - not yet implemented)
  async savePrompt(token: string, prompt: string, style: string): Promise<boolean> {
    try {
      // TODO: Implement save-prompt Netlify function
      console.log('Save prompt functionality not yet implemented');
      return false;
    } catch (error) {
      console.error('Error saving prompt:', error)
      return false
    }
  }

  // Get saved prompts (placeholder - not yet implemented)
  async getSavedPrompts(token: string): Promise<SavedPrompt[]> {
    try {
      // TODO: Implement get-saved-prompts Netlify function
      console.log('Get saved prompts functionality not yet implemented');
      return [];
    } catch (error) {
      console.error('Error fetching saved prompts:', error)
      return []
    }
  }
}

export default new UserService() 