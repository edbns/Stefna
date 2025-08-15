// src/state/intentQueue.ts
import { create } from 'zustand';

type Intent =
  | { kind: 'preset'; presetId: string }
  | { kind: 'time_machine'; key: string }
  | { kind: 'restore'; key: string }
  | { kind: 'story'; theme: string };

type State = {
  pending: Intent | null;
  sourceUrl: string | null;
  setIntent: (i: Intent) => void;
  clearIntent: () => void;
  setSourceUrl: (url: string | null) => void;
};

export const useIntentQueue = create<State>((set, get) => ({
  pending: null,
  sourceUrl: null,
  setIntent: (i) => {
    console.info('🧭 Setting intent:', i);
    set({ pending: i });
  },
  clearIntent: () => {
    console.info('🧭 Clearing intent');
    set({ pending: null });
  },
  setSourceUrl: (url) => {
    console.info('🖼️ Setting source URL:', url);
    set({ sourceUrl: url });
  },
}));

// Debug logging
if (typeof window !== 'undefined') {
  useIntentQueue.subscribe((state) => {
    console.info('🧭 Intent queue state:', { 
      pending: state.pending, 
      hasSource: !!state.sourceUrl 
    });
  });

  // Quick visibility hook for debugging (remove later)
  // @ts-ignore
  window.debugIntent = () => ({ ...useIntentQueue.getState() });
  console.info('🔍 Debug hook available: window.debugIntent()');
}

// Helper functions for external use
export function isHttps(url?: string | null): boolean {
  return !!url && url.startsWith('https://');
}

/** Public API used by ALL buttons - single orchestration point */
export async function ensureSourceThenRun(intent: Intent): Promise<void> {
  console.info('🎯 ensureSourceThenRun called:', intent);
  
  const { setIntent, sourceUrl } = useIntentQueue.getState();
  setIntent(intent);

  if (isHttps(sourceUrl)) {
    console.info('🎯 Source available, running immediately');
    // Import dynamically to avoid circular dependency
    const { kickRunIfReady } = await import('../runner/kick');
    await kickRunIfReady();
    return;
  }

  // No source yet -> ask for one
  console.info('🎯 No HTTPS source, opening file picker');
  openHiddenUploader();
  // NOTE: HiddenUploader will call setSourceUrl(secure_url) -> kickRunIfReady()
}

/** Bridge to open the hidden uploader */
export function openHiddenUploader(): void {
  console.info('📁 Opening hidden uploader');
  const input = document.getElementById('hidden-file-input') as HTMLInputElement;
  if (input) {
    input.click();
  } else {
    console.warn('Hidden file input not found');
  }
}
