import { create } from "zustand";

interface MonobankCooldownState {
  nextAllowedAt: number;
  setNextAllowedAt: (timestamp: number) => void;
  startCooldown: (seconds?: number) => void;
}

export const useMonobankCooldownStore = create<MonobankCooldownState>(
  (set) => ({
    nextAllowedAt: 0,
    setNextAllowedAt: (timestamp) => set({ nextAllowedAt: timestamp }),
    startCooldown: (seconds = 60) =>
      set({ nextAllowedAt: Date.now() + seconds * 1000 }),
  }),
);
