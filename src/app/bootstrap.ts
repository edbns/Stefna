// src/app/bootstrap.ts
const NO_DB = import.meta.env.VITE_NO_DB_MODE === 'true'

if (!NO_DB) {
  // ok to call:
  // - get-notifications
  // - update-profile / onboarding
  // - record-asset
  console.log('DB mode enabled: all endpoints available')
} else {
  console.debug('NO_DB_MODE: skipping DB calls (onboarding, notifications, record-asset).')
  
  // Override fetch to block DB endpoints in NO_DB_MODE
  const originalFetch = window.fetch
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input.toString()
    
    // Block DB endpoints in NO_DB_MODE
    if (url.includes('/record-asset') || 
        url.includes('/update-profile') || 
        url.includes('/get-notifications') ||
        url.includes('/onboarding')) {
      console.debug(`NO_DB_MODE: blocking ${url}`)
      return Promise.resolve(new Response(JSON.stringify({ 
        ok: false, 
        error: 'Endpoint blocked in NO_DB_MODE' 
      }), { status: 403 }))
    }
    
    return originalFetch.call(this, input, init)
  }
}
