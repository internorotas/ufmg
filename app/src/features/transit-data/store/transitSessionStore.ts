import { create } from 'zustand';

interface TransitSessionStore {
  transitToken: string | null;
  setTransitToken: (token: string | null) => void;
}

export const useTransitSessionStore = create<TransitSessionStore>((set) => ({
  transitToken: null,
  setTransitToken: (token) => set({ transitToken: token }),
}));

export function getTransitToken(): string | null {
  return useTransitSessionStore.getState().transitToken;
}
