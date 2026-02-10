import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

export default function SubscriptionsIndex({
    subscriptions: initialSubscriptions,
    stats: initialStats,
}: {
    subscriptions: { data: Subscription[] };
    stats: SubscriptionStats;
}) {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(
        initialSubscriptions.data,
    );
    const [stats, setStats] = useState<SubscriptionStats | null>(initialStats);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setSubscriptions(initialSubscriptions.data);
        setStats(initialStats);
    }, [initialSubscriptions, initialStats]);

    const fetchData = async () => {
        router.reload({ only: ['subscriptions', 'stats'] });
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
            fetchData();
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
            fetchData();
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
                <div className="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl dark:from-white dark:to-slate-400">
                            Subscriptions
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your recurring payments and services
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/subscriptions/create')}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-xl hover:shadow-indigo-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Subscription
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="animate-fade-in-up stagger-1 hover-lift bg-gradient-to-br from-indigo-500 to-indigo-600 text-white opacity-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Monthly Total
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {formatCurrency(
                                            stats?.monthly_total ?? 0,
                                            'CHF',
                                        )}
                                    </p>
                                </div>
                                <CalendarClock className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-2 hover-lift bg-gradient-to-br from-purple-500 to-purple-600 text-white opacity-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Yearly Total
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {formatCurrency(
                                            stats?.yearly_total ?? 0,
                                            'CHF',
                                        )}
                                    </p>
                                </div>
                                <RefreshCw className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-3 hover-lift bg-gradient-to-br from-blue-500 to-blue-600 text-white opacity-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Active
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {stats?.active_count ?? 0}
                                    </p>
                                </div>
                                <Play className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-4 hover-lift bg-gradient-to-br from-amber-500 to-amber-600 text-white opacity-0 sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Due Soon
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {stats?.upcoming_this_week ?? 0}
                                    </p>
                                </div>
                                <AlertCircle className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {isLoading ? (
                    <div className="animate-fade-in-up stagger-5 grid gap-4 opacity-0 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-40 animate-pulse rounded-xl bg-muted"
                            />
                        ))}
                    </div>
                ) : subscriptions.length === 0 ? (
                    <Card className="animate-fade-in-up stagger-5 overflow-hidden opacity-0">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                                <CalendarClock className="h-10 w-10 text-indigo-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No subscriptions yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Add your first subscription to track recurring
                                costs
                            </p>
                            <Button
                                className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
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
                            <div className="animate-fade-in-up stagger-5 space-y-4 opacity-0">
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
                            <div className="animate-fade-in-up stagger-6 space-y-4 opacity-0">
                                <h2 className="text-xl font-bold text-muted-foreground md:text-2xl">
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
            className={`group hover-lift overflow-hidden transition-all duration-200 hover:shadow-md ${
                !subscription.is_active ? 'opacity-60' : ''
            }`}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                            style={{
                                backgroundColor:
                                    subscription.color || '#8b5cf6',
                            }}
                        >
                            {subscription.merchant?.image_url && (
                                <AvatarImage
                                    src={subscription.merchant.image_url}
                                    alt={subscription.name}
                                    className="object-cover"
                                />
                            )}
                            <AvatarFallback className="bg-transparent text-white">
                                <DynamicIcon
                                    name={subscription.icon}
                                    fallback={CalendarClock}
                                    className="h-6 w-6"
                                />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold">
                                {subscription.name}
                            </h3>
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
                            ~
                            {formatCurrency(
                                subscription.monthly_equivalent,
                                subscription.currency,
                            )}
                            /mo
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
                                Next:{' '}
                                {new Date(
                                    subscription.next_billing_date,
                                ).toLocaleDateString()}
                            </span>
                        )}
                    </div>
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
                            router.visit(
                                `/subscriptions/${subscription.id}/edit`,
                            )
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
                            <Pause className="h-4 w-4 text-amber-500" />
                        ) : (
                            <Play className="h-4 w-4 text-green-500" />
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
