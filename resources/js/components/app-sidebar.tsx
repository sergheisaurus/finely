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
import { dashboard, journal } from '@/routes';
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
    PiggyBank,
    Store,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    // Overview
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
    // Transactions
    {
        title: 'Journal',
        href: journal(),
        icon: BookText,
    },
    // Money sources
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
    // Planning
    {
        title: 'Budgets',
        href: { url: '/budgets', method: 'get' },
        icon: PiggyBank,
    },
    // Recurring
    {
        title: 'Income',
        href: { url: '/income', method: 'get' },
        icon: TrendingUp,
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
    // Organization
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
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
