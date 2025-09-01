// utils/safeFetch.ts

// Safe RUM collection that ignores ad-blocker noise - FIRE AND FORGET
export function safeRum(payload: any) {
  try {
    if ('sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('https://ingesteer.services-prod.nsvcs.net/rum_collection', blob);
      return; // never await / never throw
    }
    // fallback fetch but DO NOT await and DO NOT rethrow
    fetch('https://ingesteer.services-prod.nsvcs.net/rum_collection', {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
    }).catch(() => {/* swallow */});
  } catch {/* swallow */}
}

// Safe fetch wrapper for any endpoint
export async function safeFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    console.warn(`Safe fetch failed for ${url}:`, err instanceof Error ? err.message : 'Unknown error');
    return null;
  }
}
