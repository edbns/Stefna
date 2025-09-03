// src/state/intentQueue.ts
import { create } from 'zustand';

type Intent =
  | { kind: 'preset'; presetId: string };

type State = {
  pending: Intent | null;
  sourceUrl: string | null;
  isUploading: boolean;
  isGenerating: boolean;
  setIntent: (i: Intent) => void;
  clearIntent: () => void;
  setSourceUrl: (url: string | null) => void;
  setIsUploading: (uploading: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
};

export const useIntentQueue = create<State>((set, get) => ({
  pending: null,
  sourceUrl: null,
  isUploading: false,
  isGenerating: false,
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
  setIsUploading: (uploading) => {
    console.info('📤 Setting upload state:', uploading);
    set({ isUploading: uploading });
  },
  setIsGenerating: (generating) => {
    console.info('🎨 Setting generation state:', generating);
    set({ isGenerating: generating });
  },
}));

// Debug logging
if (typeof window !== 'undefined') {
  useIntentQueue.subscribe((state) => {
    console.info('🧭 Intent queue state:', { 
      pending: state.pending, 
      hasSource: !!state.sourceUrl,
      isUploading: state.isUploading,
      isGenerating: state.isGenerating
    });
  });

  // Quick visibility hook for debugging (remove later)
  // @ts-ignore
  window.debugIntent = () => ({ ...useIntentQueue.getState() });
  console.info('🔍 Debug hook available: window.debugIntent()');
}

// A. Gate generation on a real https asset URL
export function hasHttpsUrl(url?: string | null): boolean {
  return typeof url === 'string' && url.startsWith('https://');
}

/** Public API used by ALL buttons - single orchestration point */
export async function ensureSourceThenRun(intent: Intent): Promise<void> {
  console.info('🎯 ensureSourceThenRun called:', intent);
  
  const { setIntent, sourceUrl, isUploading, isGenerating } = useIntentQueue.getState();
  
  // Don't start until we actually have an https URL
  if (!hasHttpsUrl(sourceUrl) || isUploading || isGenerating) {
    setIntent(intent);
    console.info('🎯 No HTTPS source or busy, queuing intent');
    return;
  }

  console.info('🎯 Source available, running immediately');
  // Import dynamically to avoid circular dependency
  // const { kickRunIfReady } = await import('../runner/kick'); // REMOVED - using database-driven presets now
  // await kickRunIfReady(); // REMOVED - using database-driven presets now
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

// E. UX + logging touch-ups - Map API status to user-friendly messages
export function mapApiErrorToUserMessage(status: number, message?: string): string {
  switch (status) {
    case 400:
    case 422:
      return 'Please add/upload an image first.';
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return 'You don\'t have permission for this action.';
    case 429:
      return 'Too many requests. Please wait a moment.';
    case 500:
      return 'Server error. Please try again.';
    default:
      return message || 'Something went wrong. Please try again.';
  }
}
