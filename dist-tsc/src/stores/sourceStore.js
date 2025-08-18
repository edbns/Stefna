// stores/sourceStore.ts
// Central place to manage the current source URL for generation
let currentSourceUrl = null;
export function setCurrentSourceUrl(url) {
    console.log('📸 Setting current source URL:', url);
    currentSourceUrl = url;
}
export function getCurrentSourceUrl() {
    return currentSourceUrl;
}
export function clearCurrentSourceUrl() {
    console.log('🗑️ Clearing current source URL');
    currentSourceUrl = null;
}
// Helper to validate if a URL is suitable for API calls
export function isValidSourceUrl(url) {
    return Boolean(url && /^https?:\/\//.test(url));
}
