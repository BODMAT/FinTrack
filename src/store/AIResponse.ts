import type { AIState } from "../types/custom";
import { create } from "zustand";
import { generateId } from "../utils/data.helpers";

export const useAIStore = create<AIState>((set) => ({
    prompt: "",
    response: null,
    loading: false,
    setPrompt: (prompt: string) => set(() => ({ prompt })),
    setResponse: (newResponse: string, isNew = false) => {
        const newResponseObj = { content: newResponse, date: new Date().toISOString(), isNew: isNew, id: generateId() };
        set(state => ({ response: state.response ? [...state.response, newResponseObj] : [newResponseObj] }));
    },
    setLoading: (loading: boolean) => set(() => ({ loading })),
    changeToOld: (id: number) => set(state => {
        if (!state.response) return {};
        return {
            response: state.response.map(item =>
                item.id === id ? { ...item, isNew: false } : item
            ),
        };
    }),

}));