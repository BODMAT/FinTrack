import { create } from "zustand";

interface UserStore {
    userId: number | null;
    userName: string | null;
    userPhoto: string | null;
    setUserId: (id: number) => void;
}

export const useUserStore = create<UserStore>((set) => ({
    userId: 11111,
    userName: "Name Surname",
    userPhoto: null,
    setUserId: (id) => set({ userId: id }),
}));
