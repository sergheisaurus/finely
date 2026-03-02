import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;

    if (variant === 'header') {
        return (
            <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground before:pointer-events-none before:fixed before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.08),transparent_30%)]">
                {children}
            </div>
        );
    }

    return <SidebarProvider defaultOpen={isOpen}>{children}</SidebarProvider>;
}
