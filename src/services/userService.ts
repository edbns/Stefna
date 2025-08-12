// User Service - Handles user data through Netlify Functions with custom OTP auth

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

  // Get user data from Netlify Function
  async getUserData(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/get-user`, {
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
      return this.transformUser(data.user)
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }

  // Transform Supabase user to our User interface
  private transformUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      name: supabaseUser.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email,
      avatar: supabaseUser.avatar_url,
      joinDate: supabaseUser.created_at,
      totalPhotos: supabaseUser.total_photos || 0,
      savedPrompts: supabaseUser.saved_prompts || [],
      dailyUsage: supabaseUser.daily_usage || 0,
      dailyLimit: this.getDailyLimit(supabaseUser.tier)
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

  // Update user profile
  async updateProfile(token: string, updates: Partial<User>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/update-user`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      return response.ok
    } catch (error) {
      console.error('Error updating profile:', error)
      return false
    }
  }

  // Get user statistics
  async getUserStats(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/get-user-stats`, {
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

  // Save prompt
  async savePrompt(token: string, prompt: string, style: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/save-prompt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, style })
      })

      return response.ok
    } catch (error) {
      console.error('Error saving prompt:', error)
      return false
    }
  }

  // Get saved prompts
  async getSavedPrompts(token: string): Promise<SavedPrompt[]> {
    try {
      const response = await fetch(`${this.baseUrl}/get-saved-prompts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data.prompts || []
    } catch (error) {
      console.error('Error fetching saved prompts:', error)
      return []
    }
  }
}

export default new UserService() 