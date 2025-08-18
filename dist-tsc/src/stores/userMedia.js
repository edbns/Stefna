import { create } from "zustand";
export const useUserMediaStore = create((set) => ({
    items: [],
    add: (m) => set((s) => ({ items: [m, ...s.items] })),
    clear: () => set({ items: [] }),
    remove: (id) => set((s) => ({ items: s.items.filter(item => item.id !== id) })),
}));
