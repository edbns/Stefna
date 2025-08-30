// src/app/bootstrap.ts
// Global bootstrap for the application

// Export empty object to make this a module
export {};

// Global file state for fallback
declare global {
  interface Window {
    __lastSelectedFile?: File | Blob
    __styleClashLeft?: string
    __styleClashRight?: string
  }
}

console.log('✅ Application bootstrap completed')
