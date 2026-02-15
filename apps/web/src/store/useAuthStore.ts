import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) =>
        set({
          token: accessToken,
          refreshToken: refreshToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "fintrack-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
