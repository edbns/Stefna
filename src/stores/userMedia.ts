import { create } from "zustand";

type Media = { 
  id: string; 
  url: string; 
  type: "photo" | "video"; 
  prompt?: string; 
  meta?: any;
  createdAt?: string;
  kind?: string;
};

type State = { 
  items: Media[]; 
  add: (m: Media) => void;
  clear: () => void;
  remove: (id: string) => void;
};

export const useUserMediaStore = create<State>((set) => ({
  items: [],
  add: (m) => set((s) => ({ items: [m, ...s.items] })),
  clear: () => set({ items: [] }),
  remove: (id) => set((s) => ({ items: s.items.filter(item => item.id !== id) })),
}));
