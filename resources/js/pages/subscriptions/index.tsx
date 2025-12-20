import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { Subscription, SubscriptionStats } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarClock,
    Edit,
    Eye,
    Pause,
    Play,
    Plus,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Subscriptions',
        href: '/subscriptions',
    },
];

const billingCycleLabels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
};

export default function SubscriptionsIndex() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [stats, setStats] = useState<SubscriptionStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subsResponse, statsResponse] = await Promise.all([
                api.get('/subscriptions'),
                api.get('/subscriptions/stats'),
            ]);
            setSubscriptions(subsResponse.data.data);
            setStats(statsResponse.data);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (subscription: Subscription) => {
        try {
            await api.post(`/subscriptions/${subscription.id}/toggle`);
            toast.success(
                subscription.is_active
                    ? 'Subscription paused'
                    : 'Subscription resumed',
                {
                    description: `${subscription.name} has been ${subscription.is_active ? 'paused' : 'resumed'}.`,
                },
            );
            await fetchData();
        } catch (error) {
            console.error('Failed to toggle subscription:', error);
            toast.error('Failed to update subscription');
        }
    };

    const handleDelete = async (subscription: Subscription) => {
        if (
            !confirm(
                `Are you sure you want to delete "${subscription.name}"? This will not affect existing transactions.`,
            )
        ) {
            return;
        }

        try {
            await api.delete(`/subscriptions/${subscription.id}`);
            toast.success('Subscription deleted!', {
                description: `${subscription.name} has been removed.`,
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to delete subscription:', error);
            toast.error('Failed to delete subscription');
        }
    };

    const activeSubscriptions = subscriptions.filter((s) => s.is_active);
    const pausedSubscriptions = subscriptions.filter((s) => !s.is_active);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscriptions" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
                    <div>
                        <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                            Subscriptions
                        </h1>
                        <p className="text-muted-foreground">
                            Track and manage your recurring payments
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/subscriptions/create')}
                        className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Subscription
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="animate-fade-in-up stagger-1 opacity-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Active Subscriptions
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {stats?.active_count ?? 0}
                                    </p>
                                </div>
                                <CalendarClock className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-2 opacity-0 bg-gradient-to-br from-blue-500 to-cyan-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Monthly Cost
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {formatCurrency(
                                            stats?.monthly_total ?? 0,
                                            'CHF',
                                        )}
                                    </p>
                                </div>
                                <RefreshCw className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-3 opacity-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Yearly Cost
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {formatCurrency(
                                            stats?.yearly_total ?? 0,
                                            'CHF',
                                        )}
                                    </p>
                                </div>
                                <CalendarClock className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-4 opacity-0 bg-gradient-to-br from-red-500 to-rose-600 text-white hover-lift sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Due This Week
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {stats?.upcoming_this_week ?? 0}
                                    </p>
                                </div>
                                <AlertCircle className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up stagger-5 opacity-0">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-40 animate-pulse rounded-xl bg-muted"
                            />
                        ))}
                    </div>
                ) : subscriptions.length === 0 ? (
                    <Card className="animate-fade-in-up stagger-5 opacity-0 overflow-hidden">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50">
                                <CalendarClock className="h-10 w-10 text-violet-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No subscriptions yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Start tracking your recurring payments
                            </p>
                            <Button
                                className="mt-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                                onClick={() =>
                                    router.visit('/subscriptions/create')
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Subscription
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {activeSubscriptions.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-5 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl">
                                    Active Subscriptions
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {activeSubscriptions.map((subscription) => (
                                        <SubscriptionCard
                                            key={subscription.id}
                                            subscription={subscription}
                                            onToggle={handleToggle}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {pausedSubscriptions.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-6 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl text-muted-foreground">
                                    Paused Subscriptions
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {pausedSubscriptions.map((subscription) => (
                                        <SubscriptionCard
                                            key={subscription.id}
                                            subscription={subscription}
                                            onToggle={handleToggle}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

function SubscriptionCard({
    subscription,
    onToggle,
    onDelete,
}: {
    subscription: Subscription;
    onToggle: (s: Subscription) => void;
    onDelete: (s: Subscription) => void;
}) {
    return (
        <Card
            className={`group transition-all duration-200 hover:shadow-md hover-lift overflow-hidden ${
                !subscription.is_active ? 'opacity-60' : ''
            }`}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                            style={{
                                backgroundColor:
                                    subscription.color || '#8b5cf6',
                            }}
                        >
                            <DynamicIcon
                                name={subscription.icon}
                                fallback={CalendarClock}
                                className="h-6 w-6 text-white"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold">{subscription.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {billingCycleLabels[subscription.billing_cycle]}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">
                            {formatCurrency(
                                subscription.amount,
                                subscription.currency,
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            ~{formatCurrency(subscription.monthly_equivalent, subscription.currency)}/mo
                        </p>
                    </div>
                </div>

                {subscription.next_billing_date && subscription.is_active && (
                    <div className="mt-3 flex items-center gap-2">
                        {subscription.is_overdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-300">
                                <AlertCircle className="h-3 w-3" />
                                Overdue
                            </span>
                        ) : subscription.is_due_soon ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                <CalendarClock className="h-3 w-3" />
                                Due soon
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                Next: {new Date(subscription.next_billing_date).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                )}

                {subscription.merchant && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        {subscription.merchant.name}
                    </p>
                )}

                <div className="mt-4 flex gap-1 border-t pt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            router.visit(`/subscriptions/${subscription.id}`)
                        }
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            router.visit(`/subscriptions/${subscription.id}/edit`)
                        }
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggle(subscription)}
                    >
                        {subscription.is_active ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(subscription)}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
