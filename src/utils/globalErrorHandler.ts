// Global error handling to prevent UI from getting stuck
export function setupGlobalErrorHandling() {
  // Global safety net for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
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
    console.error('Global error caught:', event.error);
    
    // Clear any stuck generating states
    const clearEvent = new CustomEvent('clear-generating-state');
    window.dispatchEvent(clearEvent);
  });

  console.log('✅ Global error handling setup complete');
}
