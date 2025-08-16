// utils/safeFetch.ts

// Safe notifications fetch with graceful error handling
export async function safeNotificationsFetch(limit: number = 10) {
  try {
    const response = await fetch(`/.netlify/functions/get-notifications?limit=${limit}`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`notifications ${response.status}`);
    }
  } catch (err) {
    console.warn('Notifications suppressed:', err instanceof Error ? err.message : 'Unknown error');
    return null;
  }
}

// Safe RUM collection that ignores ad-blocker noise
export async function safeRum(payload: any) {
  try {
    await fetch('https://ingesteer.services-prod.nsvcs.net/rum_collection', {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    // Ignore adblock failures silently
  }
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
