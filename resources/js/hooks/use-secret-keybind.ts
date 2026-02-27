import { useEffect, useRef } from 'react';
import { useSecretStore } from '@/stores/useSecretStore';

const SECRET_WORDS = [
    'drooling',
    'dildogag',
    'ballgag',
    'rope',
    'handcuffs',
    'deepthroat',
    'tights',
    'cumslut',
    'whipped',
    'collar',
    'leash',
    'bondage',
    'spanking',
    'blindfold',
    'submission',
    'dominated',
    'gagged',
    'hogtied',
    'buttplug',
    'mmmmmm', // muffled gagged moan 🤤
];

const KONAMI = [
    'arrowup', 'arrowup',
    'arrowdown', 'arrowdown',
    'arrowleft', 'arrowright',
    'arrowleft', 'arrowright',
];

export function useSecretKeybind() {
    const { toggleSecretMode } = useSecretStore();
    const charBufferRef = useRef<string>('');
    const konamiBufferRef = useRef<string[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const inInput =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // --- Konami code: always listen, even in inputs ---
            const keyLower = e.key.toLowerCase();
            if (keyLower.startsWith('arrow')) {
                konamiBufferRef.current = [...konamiBufferRef.current, keyLower].slice(-KONAMI.length);
                if (konamiBufferRef.current.join(',') === KONAMI.join(',')) {
                    toggleSecretMode();
                    konamiBufferRef.current = [];
                }
                return; // don't process arrow keys as chars
            }

            // --- Word matching: only when not in an input ---
            if (inInput) return;

            charBufferRef.current += keyLower;
            if (charBufferRef.current.length > 25) {
                charBufferRef.current = charBufferRef.current.slice(-25);
            }

            for (const word of SECRET_WORDS) {
                if (charBufferRef.current.endsWith(word)) {
                    toggleSecretMode();
                    charBufferRef.current = '';
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSecretMode]);
}
