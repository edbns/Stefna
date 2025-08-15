// src/app/bootstrap.ts
// Global bootstrap for the application

// NO_DB_MODE: Gate noisy endpoints
const NO_DB_MODE = import.meta.env.VITE_NO_DB_MODE === 'true'

if (NO_DB_MODE) {
  console.log('🚫 NO_DB_MODE: Silencing DB calls (onboarding, notifications, record-asset)')
  
  // Override fetch to block DB-related calls
  const originalFetch = window.fetch
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input.toString()
    
    // Block DB-related endpoints
    if (url.includes('/.netlify/functions/') && (
      url.includes('get-notifications') ||
      url.includes('update-profile') ||
      url.includes('onboarding') ||
      url.includes('record-asset')
    )) {
      console.debug('NO_DB_MODE: blocking DB call to', url)
      return Promise.resolve(new Response(JSON.stringify({ 
        error: 'NO_DB_MODE: DB calls disabled',
        success: false 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
    }
    
    // Allow all other calls
    return originalFetch.call(this, input, init)
  }
} else {
  console.log('✅ DB_MODE: All endpoints enabled')
}

// Global file state for fallback
declare global {
  interface Window {
    __lastSelectedFile?: File
    __styleClashLeft?: string
    __styleClashRight?: string
  }
}
