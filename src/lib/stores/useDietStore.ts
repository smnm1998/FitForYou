import { create } from "zustand";
import { SavedDietItem } from "@/lib/types/diet";

interface DietStore {
    selectedDiet: SavedDietItem | null;
    hasAutoOpened: boolean;
    openDiet: (diet: SavedDietItem) => void;
    closeDiet: () => void;
    setHasAutoOpened: (value: boolean) => void;
}

export const useDietStore = create<DietStore>((set) => ({
    selectedDiet: null,
    hasAutoOpened: false,
    openDiet: (diet) => {
        set({ selectedDiet: diet });
        document.body.style.overflow = "hidden";
    },
    closeDiet: () => {
        set({ selectedDiet: null });
        document.body.style.overflow = "unset";
    },
    setHasAutoOpened: (value) => set({ hasAutoOpened: value }),
}));
