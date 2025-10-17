// Global error handling to prevent UI from getting stuck
export function setupGlobalErrorHandling() {
  // Global safety net for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason || '');
    
    // Filter out common blocked request errors and non-critical errors
    if (msg.includes('ERR_BLOCKED_BY_CLIENT') || 
        msg.includes('net::ERR_BLOCKED_BY_CLIENT') ||
        msg.includes('Failed to fetch') ||
        msg.includes('rum_collection') ||
        msg.includes('analytics') ||
        msg.includes('tracking') ||
        msg.includes('telemetry') ||
        msg.includes('metrics') ||
        msg.includes('CORS') ||
        msg.includes('NetworkError') ||
        msg.includes('AbortError') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('Loading CSS chunk') ||
        msg.includes('ResizeObserver loop limit exceeded') ||
        msg.includes('Non-Error promise rejection')) {
      // Silently ignore blocked requests and non-critical errors
      event.preventDefault();
      return;
    }
    
    console.error('Global unhandledrejection caught:', event.reason);
    
    // Only clear generating states and show error for actual generation-related errors
    // Check if this looks like a generation error
    const isGenerationError = msg.includes('generation') || 
                             msg.includes('Generation') ||
                             msg.includes('dispatchGenerate') ||
                             msg.includes('unified-generate') ||
                             msg.includes('INSUFFICIENT_CREDITS');
    
    if (isGenerationError) {
      // Clear any stuck generating states
      const clearEvent = new CustomEvent('clear-generating-state');
      window.dispatchEvent(clearEvent);
      
      // Show user-friendly error only for generation-related errors
      window.dispatchEvent(new CustomEvent('generation-error', { 
        detail: { 
          message: 'Something went wrong. Please try again.', 
          timestamp: Date.now() 
        } 
      }));
    }
    
    // Prevent the default browser error
    event.preventDefault();
  });

  // Global error handler
  window.addEventListener('error', (event) => {
    const errorMsg = String(event.error || event.message || '');
    
    // Filter out common blocked request errors
    if (errorMsg.includes('ERR_BLOCKED_BY_CLIENT') || 
        errorMsg.includes('net::ERR_BLOCKED_BY_CLIENT') ||
        errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('rum_collection') ||
        errorMsg.includes('analytics') ||
        errorMsg.includes('tracking') ||
        errorMsg.includes('telemetry') ||
        errorMsg.includes('metrics')) {
      // Silently ignore blocked requests
      event.preventDefault();
      return;
    }
    
    console.error('Global error caught:', event.error);
    
    // Clear any stuck generating states
    const clearEvent = new CustomEvent('clear-generating-state');
    window.dispatchEvent(clearEvent);
  });

  console.log('✅ Global error handling setup complete');
}
