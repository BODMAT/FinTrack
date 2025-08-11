import { create } from 'zustand';

interface BurgerState {
    isBurgerOpen: boolean;
    isMobile: boolean;
    setIsMobile: (val: boolean) => void;
    toggleBurger: () => void;
    closeBurger: () => void;
}

export const useBurgerStore = create<BurgerState>((set) => ({
    isBurgerOpen: false,
    isMobile: window.innerWidth <= 768,
    setIsMobile: (val) => set({ isMobile: val }),
    toggleBurger: () =>
        set((state) => (state.isMobile ? { isBurgerOpen: !state.isBurgerOpen } : {})),
    closeBurger: () => set({ isBurgerOpen: false }),
}));
