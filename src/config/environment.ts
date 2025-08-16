// Environment Configuration Service
// Centralized management of all environment variables

export interface EnvironmentConfig {
  // App Configuration
  appEnv: 'development' | 'production' | 'staging'
  debugMode: boolean
  
  // Neon Database Configuration (for reference only - not used in frontend)
  neonDatabaseUrl?: string
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
      
      // Neon Database Configuration (for reference only)
      neonDatabaseUrl: import.meta.env.VITE_NEON_DATABASE_URL || ''
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

  // Validation methods
  isConfigured(): boolean {
    // Check if AIML API key is configured (standardized to single name)
    const aimlApiKey = import.meta.env.VITE_AIML_API_KEY
    
    if (!aimlApiKey) {
      console.error('Missing AIML API key!')
      console.error('Expected: VITE_AIML_API_KEY')
      console.error('Available VITE_ vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).join(', '))
      return false
    }
    
    console.log('✅ AIML API key found:', aimlApiKey ? 'Configured' : 'Missing')
    
    // Note: Supabase configuration is no longer required since we use Neon backend
    // All database operations now go through our Netlify functions
    
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
      neonConfigured: !!this.config.neonDatabaseUrl,
      aimlConfigured: !!import.meta.env.VITE_AIML_API_KEY
    }
  }
}

export default EnvironmentService.getInstance() 