// src/stores/authStore.ts
import { create } from 'zustand'

interface User {
  id: string
  email: string
  username?: string
  avatar?: string
  tier?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),
  
  setToken: (token) => set({ token }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  logout: () => set({
    user: null,
    isAuthenticated: false,
    token: null
  })
}))

// Global access for non-React contexts
export const authStore = {
  getState: () => useAuthStore.getState(),
  subscribe: useAuthStore.subscribe,
}
