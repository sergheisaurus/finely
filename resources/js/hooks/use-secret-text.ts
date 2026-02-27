import { useSecretStore } from '@/stores/useSecretStore';

/**
 * Returns `kinky` when Secret Mode is active, otherwise `normal`.
 */
export function useSecretText(normal: string, kinky: string): string {
    const { isSecretModeActive } = useSecretStore();
    return isSecretModeActive ? kinky : normal;
}
