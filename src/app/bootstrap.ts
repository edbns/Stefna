// src/app/bootstrap.ts
// Global bootstrap for the application

// Global file state for fallback
declare global {
  interface Window {
    __lastSelectedFile?: File
    __styleClashLeft?: string
    __styleClashRight?: string
  }
}

console.log('✅ Application bootstrap completed')

// Export to make this a module
export {}
