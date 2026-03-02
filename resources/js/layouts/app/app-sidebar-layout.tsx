import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="m-0 overflow-x-hidden bg-transparent p-0"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="relative mx-auto flex h-full w-full max-w-7xl flex-1 flex-col px-3 pb-4 md:px-5 lg:px-6">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
