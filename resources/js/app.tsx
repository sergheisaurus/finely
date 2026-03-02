import '../css/app.css';

import { Toaster } from '@/components/ui/sonner';
import { AiChatProvider } from '@/context/ai-chat-context';
import { createInertiaApp } from '@inertiajs/react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

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
    // @ts-expect-error Inertia types don't currently expose `prefetch`.
    prefetch: {
        default: ['hover'],
    },
});

// This will set light / dark mode on load...
initializeTheme();
