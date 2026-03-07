import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import type { Order, OrderStats } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    Check,
    ChevronRight,
    Package,
    Plus,
    Search,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Orders',
        href: '/orders',
    },
];

const statusStyles: Record<string, string> = {
    placed: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
    shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    delivered:
        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    returned:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    partial:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const statusLabels: Record<string, string> = {
    placed: 'Placed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
    partial: 'Partial',
};

export default function OrdersIndex({
    orders: initialOrders,
    stats: initialStats,
}: {
    orders: { data: Order[] };
    stats: OrderStats;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | Order['status']>('all');
    const orders = initialOrders.data;
    const stats = initialStats;

    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            const matchesTab = activeTab === 'all' || o.status === activeTab;
            const q = searchQuery.trim().toLowerCase();
            if (!q) return matchesTab;

            const haystack = [
                o.order_number,
                o.provider,
                o.merchant?.name,
                o.notes,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return matchesTab && haystack.includes(q);
        });
    }, [orders, activeTab, searchQuery]);

    const handleDelete = async (orderId: number) => {
        const order = orders.find((o) => o.id === orderId);
        if (
            !confirm(
                `Delete this order${order?.order_number ? ` (#${order.order_number})` : ''}?`,
            )
        ) {
            return;
        }

        try {
            await api.delete(`/orders/${orderId}`);
            toast.success('Order deleted');
            router.reload({ only: ['orders', 'stats'] });
        } catch (error) {
            console.error('Failed to delete order:', error);
            toast.error('Failed to delete order');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />

            <div className="space-y-6 py-6 sm:space-y-8 sm:py-8">
                <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-white via-white to-sky-50/70 px-5 py-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:px-6 sm:py-7 dark:from-card dark:via-card dark:to-sky-950/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/85 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-sky-700 uppercase shadow-sm dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
                                <Sparkles className="h-3.5 w-3.5" />
                                Purchase tracking
                            </div>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                    Orders
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Keep orders, delivery status, totals, and
                                    linked transactions in one calmer flow.
                                </p>
                            </div>
                        </div>

                        <Button
                            className="rounded-full px-5"
                            onClick={() => router.visit('/orders/create')}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Order
                        </Button>
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-border/70 bg-card/90">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Orders
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {stats.total_count}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900/20">
                                    <Package className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/90">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Delivered
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {stats.delivered_count}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                                    <Check className="h-5 w-5 text-green-700 dark:text-green-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/90 sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Spend
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {formatCurrency(
                                            stats.total_amount,
                                            orders[0]?.currency || 'CHF',
                                        )}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                                    <Calendar className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/70 bg-card/90">
                    <CardContent className="p-6">
                        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <Tabs
                                value={activeTab}
                                onValueChange={(v) =>
                                    setActiveTab(v as typeof activeTab)
                                }
                                className="w-full md:w-auto"
                            >
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="placed">
                                        Placed
                                    </TabsTrigger>
                                    <TabsTrigger value="shipped">
                                        Shipped
                                    </TabsTrigger>
                                    <TabsTrigger value="delivered">
                                        Delivered
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="relative w-full md:w-72">
                                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search orders..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            {filteredOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                        <Package className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold">
                                        No orders found
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Try adjusting your search or filter
                                    </p>
                                </div>
                            ) : (
                                filteredOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="group flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-background/70 p-3 transition-all hover:border-primary/25 hover:bg-accent/35"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.visit(
                                                    `/orders/${order.id}`,
                                                )
                                            }
                                            className="flex flex-1 items-center gap-3 text-left"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 shadow-sm dark:bg-slate-900/30">
                                                <Package className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="truncate font-semibold">
                                                        {order.merchant?.name ||
                                                            order.provider ||
                                                            'Order'}
                                                    </span>
                                                    {order.order_number && (
                                                        <span className="text-xs text-muted-foreground">
                                                            #
                                                            {order.order_number}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                                            statusStyles[
                                                                order.status
                                                            ] ||
                                                                statusStyles.placed,
                                                        )}
                                                    >
                                                        {statusLabels[
                                                            order.status
                                                        ] || order.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {order.ordered_at} •{' '}
                                                    {formatCurrency(
                                                        order.amount,
                                                        order.currency,
                                                    )}
                                                    {typeof order.items_count ===
                                                        'number' &&
                                                        ` • ${order.items_count} items`}
                                                    {typeof order.transactions_count ===
                                                        'number' &&
                                                        ` • ${order.transactions_count} txs`}
                                                </p>
                                            </div>
                                        </button>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    router.visit(
                                                        `/orders/${order.id}/edit`,
                                                    )
                                                }
                                            >
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    handleDelete(order.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
