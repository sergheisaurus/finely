import { AiChat } from '@/components/ai-chat';
import { useSecretKeybind } from '@/hooks/use-secret-keybind';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

function AppLayoutInner({ children, breadcrumbs, ...props }: AppLayoutProps) {
    useSecretKeybind();
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
            <AiChat />
        </AppLayoutTemplate>
    );
}

export default AppLayoutInner;
