import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ThemeState {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        devtools(
            (set, get) => ({
                theme: 'dark',
                toggleTheme: () => {
                    const newTheme = get().theme === 'light' ? 'dark' : 'light';
                    document.documentElement.classList.toggle('dark', newTheme === 'dark');
                    document.documentElement.classList.toggle('light', newTheme === 'light');
                    set({ theme: newTheme });
                },
            })
        ),
        {
            name: 'theme-fintrack',
            onRehydrateStorage: () => (state) => {
                if (state?.theme) {
                    document.documentElement.classList.toggle('dark', state.theme === 'dark');
                    document.documentElement.classList.toggle('light', state.theme === 'light');
                }
            },
        }
    )
);