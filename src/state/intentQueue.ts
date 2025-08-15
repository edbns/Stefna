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
}
