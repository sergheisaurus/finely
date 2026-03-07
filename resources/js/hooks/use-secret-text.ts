import { useSecretStore } from '@/stores/useSecretStore';

/**
 * Returns `secret` when Secret Mode is active, otherwise `normal`.
 */
export function useSecretText(normal: string, secret: string): string {
    const { isSecretModeActive } = useSecretStore();
    return isSecretModeActive ? secret : normal;
}
