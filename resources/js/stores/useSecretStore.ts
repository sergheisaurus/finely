import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SecretStoreState {
    isSecretModeActive: boolean;
    toggleSecretMode: () => void;
    setSecretMode: (active: boolean) => void;
}

export const useSecretStore = create<SecretStoreState>()(
    persist(
        (set) => ({
            isSecretModeActive: false,
            toggleSecretMode: () =>
                set((state) => ({
                    isSecretModeActive: !state.isSecretModeActive,
                })),
            setSecretMode: (active: boolean) =>
                set({ isSecretModeActive: active }),
        }),
        {
            name: 'finely-secret-store', // Persist secret state in local storage
        },
    ),
);
