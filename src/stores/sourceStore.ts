// stores/sourceStore.ts
// Central place to manage the current source URL for generation

let currentSourceUrl: string | null = null;

export function setCurrentSourceUrl(url: string): void {
  console.log('📸 Setting current source URL:', url);
  currentSourceUrl = url;
}

export function getCurrentSourceUrl(): string | null {
  return currentSourceUrl;
}

export function clearCurrentSourceUrl(): void {
  console.log('🗑️ Clearing current source URL');
  currentSourceUrl = null;
}

// Helper to validate if a URL is suitable for API calls
export function isValidSourceUrl(url: string | null): boolean {
  return Boolean(url && /^https?:\/\//.test(url));
}
