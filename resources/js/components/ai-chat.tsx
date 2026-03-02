import { Button } from '@/components/ui/button';
import { useAiChat } from '@/context/ai-chat-context';
import { MessageCircle } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

const LazyAiChatWindow = lazy(() =>
    import('@/components/ai-chat-window').then((m) => ({
        default: m.AiChatWindow,
    })),
);

export function AiChat() {
    const { isOpen, setIsOpen } = useAiChat();
    const [hasLoaded, setHasLoaded] = useState(false);

    // Prefetch the chat chunk after initial paint.
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            import('@/components/ai-chat-window')
                .then(() => {
                    // noop
                })
                .catch(() => {
                    // noop
                });
        }, 1200);

        return () => window.clearTimeout(timeout);
    }, []);

    // Ensure the chunk is loaded once the user opens chat.
    useEffect(() => {
        if (isOpen) {
            setHasLoaded(true);
        }
    }, [isOpen]);

    return (
        <>
            {!isOpen && (
                <Button
                    onClick={() => {
                        setHasLoaded(true);
                        setIsOpen(true);
                    }}
                    className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105"
                    size="icon"
                    aria-label="Open Finely AI"
                >
                    <MessageCircle className="h-8 w-8" />
                </Button>
            )}

            {(hasLoaded || isOpen) && (
                <Suspense fallback={null}>
                    <LazyAiChatWindow />
                </Suspense>
            )}
        </>
    );
}
