import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setAuthenticated: (value: boolean) => void;
  setBootstrapping: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  isBootstrapping: true,

  setAuthenticated: (value) =>
    set({
      isAuthenticated: value,
    }),

  setBootstrapping: (value) =>
    set({
      isBootstrapping: value,
    }),

  logout: () =>
    set({
      isAuthenticated: false,
      isBootstrapping: false,
    }),
}));
