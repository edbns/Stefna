// Global error handling to prevent UI from getting stuck
export function setupGlobalErrorHandling() {
  // Global safety net for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason || '');
    
    // Filter out common blocked request errors
    if (msg.includes('ERR_BLOCKED_BY_CLIENT') || 
        msg.includes('net::ERR_BLOCKED_BY_CLIENT') ||
        msg.includes('Failed to fetch') ||
        msg.includes('rum_collection') ||
        msg.includes('analytics') ||
        msg.includes('tracking') ||
        msg.includes('telemetry') ||
        msg.includes('metrics')) {
      // Silently ignore blocked requests - don't log them
      event.preventDefault();
      return;
    }
    
    console.error('Global unhandledrejection caught:', event.reason);
    
    // Clear any stuck generating states
    const clearEvent = new CustomEvent('clear-generating-state');
    window.dispatchEvent(clearEvent);
    
    // Show user-friendly error
    window.dispatchEvent(new CustomEvent('generation-error', { 
      detail: { 
        message: 'Something went wrong. Please try again.', 
        timestamp: Date.now() 
      } 
    }));
    
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
