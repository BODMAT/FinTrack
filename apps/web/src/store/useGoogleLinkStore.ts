import { create } from "zustand";

export interface GoogleLinkNotice {
  ok: boolean;
  // Raw backend message for errors; success uses a translated string instead.
  message?: string;
}

interface GoogleLinkState {
  notice: GoogleLinkNotice | null;
  setNotice: (notice: GoogleLinkNotice) => void;
  clearNotice: () => void;
}

export const useGoogleLinkStore = create<GoogleLinkState>((set) => ({
  notice: null,
  setNotice: (notice) => set({ notice }),
  clearNotice: () => set({ notice: null }),
}));
