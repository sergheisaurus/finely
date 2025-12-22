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
import { BookText, CalendarClock, CreditCard, FileText, FolderTree, LayoutGrid, Store, TrendingUp, Wallet } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
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
        title: 'Categories',
        href: { url: '/categories', method: 'get' },
        icon: FolderTree,
    },
    {
        title: 'Merchants',
        href: { url: '/merchants', method: 'get' },
        icon: Store,
    },
    {
        title: 'Subscriptions',
        href: { url: '/subscriptions', method: 'get' },
        icon: CalendarClock,
    },
    {
        title: 'Income',
        href: { url: '/income', method: 'get' },
        icon: TrendingUp,
    },
    {
        title: 'Invoices',
        href: { url: '/invoices', method: 'get' },
        icon: FileText,
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
