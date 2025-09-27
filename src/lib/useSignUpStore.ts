import { create } from "zustand";

interface SignUpState {
    currentStep: number;
    isUserIdChecked: boolean;
    isNicknameChecked: boolean;
    isSubmitting: boolean;
}

interface SignUpActions {
    setCurrentStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    setUserIdChecked: (isChecked: boolean) => void;
    setNicknameChecked: (isChecked: boolean) => void;
    setIsSubmitting: (isSubmitting: boolean) => void;
    reset: () => void;
}

const initialState: SignUpState = {
    currentStep: 1,
    isUserIdChecked: false,
    isNicknameChecked: false,
    isSubmitting: false,
};

export const useSignUpStore = create<SignUpState & SignUpActions>((set) => ({
    ...initialState,
    setCurrentStep: (step) => set({ currentStep: step }),
    nextStep: () =>
        set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
    prevStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
    setUserIdChecked: (isChecked) => set({ isUserIdChecked: isChecked }),
    setNicknameChecked: (isChecked) => set({ isNicknameChecked: isChecked }),
    setIsSubmitting: (isSubmitting) => set({ isSubmitting: isSubmitting }),
    reset: () => set(initialState),
}));
