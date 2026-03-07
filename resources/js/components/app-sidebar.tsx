import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard, journal } from '@/routes/pages';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    BookText,
    CalendarClock,
    CreditCard,
    FileText,
    FolderTree,
    LayoutGrid,
    MessageSquare,
    Package,
    PiggyBank,
    Store,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import AppLogo from './app-logo';
import AppearanceToggleDropdown from './appearance-dropdown';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Statistics',
        href: { url: '/statistics', method: 'get' },
        icon: BarChart3,
    },
    {
        title: 'AI Chat',
        href: { url: '/chat', method: 'get' },
        icon: MessageSquare,
    },
];

const moneyNavItems: NavItem[] = [
    {
        title: 'Journal',
        href: journal(),
        icon: BookText,
    },
    {
        title: 'Accounts',
        href: { url: '/accounts', method: 'get' },
        icon: Wallet,
    },
    {
        title: 'Cards',
        href: { url: '/cards', method: 'get' },
        icon: CreditCard,
    },
    {
        title: 'Income',
        href: { url: '/income', method: 'get' },
        icon: TrendingUp,
    },
];

const planningNavItems: NavItem[] = [
    {
        title: 'Budgets',
        href: { url: '/budgets', method: 'get' },
        icon: PiggyBank,
    },
    {
        title: 'Subscriptions',
        href: { url: '/subscriptions', method: 'get' },
        icon: CalendarClock,
    },
    {
        title: 'Invoices',
        href: { url: '/invoices', method: 'get' },
        icon: FileText,
    },
    {
        title: 'Orders',
        href: { url: '/orders', method: 'get' },
        icon: Package,
    },
    {
        title: 'Inventory',
        href: { url: '/inventory', method: 'get' },
        icon: Package,
    },
];

const organizationNavItems: NavItem[] = [
    {
        title: 'Categories',
        href: { url: '/categories', method: 'get' },
        icon: FolderTree,
    },
    {
        title: 'Merchants',
        href: { url: '/merchants', method: 'get' },
        icon: Store,
    },
];

export function AppSidebar() {
    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-sidebar-border/70"
        >
            <SidebarHeader className="gap-4 border-b border-sidebar-border/70 p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="flex items-center justify-between rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/45 px-3 py-3 text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    <div>
                        <p className="text-sm font-semibold">Calm control</p>
                        <p className="text-xs text-sidebar-foreground/70">
                            Clear money tracking, less visual noise.
                        </p>
                    </div>
                    <AppearanceToggleDropdown />
                </div>
            </SidebarHeader>

            <SidebarContent className="gap-4 px-2 py-4">
                <div className="px-2 group-data-[collapsible=icon]:hidden">
                    <p className="px-2 text-[11px] font-semibold tracking-[0.2em] text-sidebar-foreground/45 uppercase">
                        Overview
                    </p>
                </div>
                <NavMain items={mainNavItems} />
                <div className="px-2 group-data-[collapsible=icon]:hidden">
                    <p className="px-2 text-[11px] font-semibold tracking-[0.2em] text-sidebar-foreground/45 uppercase">
                        Money
                    </p>
                </div>
                <NavMain items={moneyNavItems} />
                <div className="px-2 group-data-[collapsible=icon]:hidden">
                    <p className="px-2 text-[11px] font-semibold tracking-[0.2em] text-sidebar-foreground/45 uppercase">
                        Planning
                    </p>
                </div>
                <NavMain items={planningNavItems} />
                <div className="px-2 group-data-[collapsible=icon]:hidden">
                    <p className="px-2 text-[11px] font-semibold tracking-[0.2em] text-sidebar-foreground/45 uppercase">
                        Setup
                    </p>
                </div>
                <NavMain items={organizationNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/70 p-3">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
