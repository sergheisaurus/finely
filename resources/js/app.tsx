import '../css/app.css';

import { Toaster } from '@/components/ui/sonner';
import { AiChatProvider } from '@/context/ai-chat-context';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Finely';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <AiChatProvider>
                    <App {...props} />
                    <Toaster richColors position="top-right" />
                </AiChatProvider>
            </StrictMode>,
        );
    },
    progress: {
        color: '#10b981',
    },
});

// This will set light / dark mode on load...
initializeTheme();
