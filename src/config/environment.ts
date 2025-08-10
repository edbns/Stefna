// Environment Configuration Service
// Centralized management of all environment variables

export interface EnvironmentConfig {
  // App Configuration
  appEnv: 'development' | 'production' | 'staging'
  debugMode: boolean
  
  // Supabase Configuration
  supabaseUrl: string
  supabaseAnonKey: string
}

class EnvironmentService {
  private static instance: EnvironmentService
  private config: EnvironmentConfig

  private constructor() {
    this.config = this.loadEnvironmentConfig()
  }

  static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService()
    }
    return EnvironmentService.instance
  }

  private loadEnvironmentConfig(): EnvironmentConfig {
    return {
      // App Configuration
      appEnv: (import.meta.env.VITE_APP_ENV as 'development' | 'production' | 'staging') || 'development',
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
      
      // Supabase Configuration
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    }
  }

  // Get the full configuration
  getConfig(): EnvironmentConfig {
    return this.config
  }

  // Individual getters for type safety

  getAppEnv(): string {
    return this.config.appEnv
  }

  isDebugMode(): boolean {
    return this.config.debugMode
  }

  isProduction(): boolean {
    return this.config.appEnv === 'production'
  }

  // Supabase Configuration
  getSupabaseUrl(): string {
    return this.config.supabaseUrl
  }

  getSupabaseAnonKey(): string {
    return this.config.supabaseAnonKey
  }

  // Validation methods
  isConfigured(): boolean {
    // Check if AIML API key is configured (standardized to single name)
    const aimlApiKey = import.meta.env.VITE_AIML_API_KEY
    
    if (!aimlApiKey) {
      console.error('Missing AIML API key!')
      console.error('Expected: VITE_AIML_API_KEY')
      console.error('Available VITE_ vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))
      return false
    }
    
    console.log('✅ AIML API key found:', aimlApiKey ? 'Configured' : 'Missing')
    
    // Check if Supabase is configured
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      console.error('Missing Supabase configuration!')
      console.error('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
      console.error('Available VITE_ vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))
      return false
    }
    
    console.log('✅ Supabase configuration found')
    
    // In development mode, always allow generation
    if (this.config.appEnv === 'development') {
      return true
    }
    
    // In production, check if API keys are configured
    // Note: In browser environment, server-side env vars are not available
    // The actual API key validation happens server-side in Netlify Functions
    return true // Allow generation, let server-side handle API key validation
  }

  // Get configuration status for debugging
  getConfigStatus(): { [key: string]: boolean } {
    return {
      fullyConfigured: this.isConfigured(),
      supabaseConfigured: !!(this.config.supabaseUrl && this.config.supabaseAnonKey),
      aimlConfigured: !!import.meta.env.VITE_AIML_API_KEY
    }
  }
}

export default EnvironmentService.getInstance() 