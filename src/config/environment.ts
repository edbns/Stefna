// Environment Configuration Service
// Centralized management of all environment variables

export interface EnvironmentConfig {
  // App Configuration
  appEnv: 'development' | 'production' | 'staging'
  debugMode: boolean
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
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
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
    // Check if AIML API key is configured (try both possible names)
    const aimlApiKey = import.meta.env.VITE_AIMLAPI_API_KEY || import.meta.env.VITE_AIML_API_KEY
    
    if (!aimlApiKey) {
      console.error('Missing AIML API key!')
      console.error('Expected one of: VITE_AIMLAPI_API_KEY or VITE_AIML_API_KEY')
      console.error('Available VITE_ vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))
      return false
    }
    
    console.log('✅ AIML API key found:', aimlApiKey ? 'Configured' : 'Missing')
    
    // In development mode, always allow generation (for testing)
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
      fullyConfigured: this.isConfigured()
    }
  }
}

export default EnvironmentService.getInstance() 