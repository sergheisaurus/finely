import { useSecretStore } from '@/stores/useSecretStore';
import { useEffect, useRef } from 'react';

const SECRET_WORDS = ['secret', 'privacy', 'private', 'hidden', 'incognito'];

const KONAMI = [
    'arrowup',
    'arrowup',
    'arrowdown',
    'arrowdown',
    'arrowleft',
    'arrowright',
    'arrowleft',
    'arrowright',
];

export function useSecretKeybind() {
    const { toggleSecretMode } = useSecretStore();
    const charBufferRef = useRef<string>('');
    const konamiBufferRef = useRef<string[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === '.') {
                e.preventDefault();
                toggleSecretMode();
                return;
            }

            const target = e.target as HTMLElement;
            const inInput =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            const keyLower = e.key.toLowerCase();
            if (keyLower.startsWith('arrow')) {
                konamiBufferRef.current = [
                    ...konamiBufferRef.current,
                    keyLower,
                ].slice(-KONAMI.length);
                if (konamiBufferRef.current.join(',') === KONAMI.join(',')) {
                    toggleSecretMode();
                    konamiBufferRef.current = [];
                }
                return;
            }

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
