import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const currentPage = breadcrumbs.at(-1)?.title || 'Workspace';

    return (
        <header className="sticky top-0 z-50 flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl transition-[width,height] ease-linear md:px-5 lg:px-6">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <SidebarTrigger className="-ml-1 rounded-xl border border-border/70 bg-card/85 shadow-sm" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                            {currentPage}
                        </p>
                        <div className="hidden sm:block">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground lg:block">
                        Built for calmer daily finance flows
                    </div>
                    <AppearanceToggleDropdown />
                </div>
            </div>
        </header>
    );
}
