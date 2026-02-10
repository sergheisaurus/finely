import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { Subscription, Transaction } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    ArrowLeft,
    CalendarClock,
    CreditCard,
    Edit,
    Pause,
    Play,
    Trash2,
    Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const billingCycleLabels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
};

export default function SubscriptionShow({
    subscriptionId,
}: {
    subscriptionId: string;
}) {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Subscriptions',
            href: '/subscriptions',
        },
        {
            title: subscription?.name || 'Loading...',
            href: `/subscriptions/${subscriptionId}`,
        },
    ];

    const fetchData = useCallback(async () => {
        try {
            const [subRes, transRes] = await Promise.all([
                api.get(`/subscriptions/${subscriptionId}`),
                api.get(`/subscriptions/${subscriptionId}/transactions`),
            ]);
            setSubscription(subRes.data.data);
            setTransactions(transRes.data.data);
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
            toast.error('Failed to load subscription');
        } finally {
            setIsLoading(false);
        }
    }, [subscriptionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggle = async () => {
        if (!subscription) return;
        try {
            await api.post(`/subscriptions/${subscription.id}/toggle`);
            toast.success(
                subscription.is_active
                    ? 'Subscription paused'
                    : 'Subscription resumed',
            );
            await fetchData();
        } catch (error) {
            console.error('Failed to toggle subscription:', error);
            toast.error('Failed to update subscription');
        }
    };

    const handleProcessPayment = async () => {
        if (!subscription) return;

        // Optimistically update
        const toastId = toast.loading('Processing payment...');

        try {
            await api.post(`/subscriptions/${subscription.id}/process`);
            toast.dismiss(toastId);
            toast.success('Payment processed successfully');
            await fetchData();
        } catch (error: unknown) {
            toast.dismiss(toastId);
            console.error('Failed to process payment:', error);
            // The API returns 422 with a message if not due or inactive, handle it gracefully
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to process payment');
            }
        }
    };

    const handleDelete = async () => {
        if (!subscription) return;
        if (
            !confirm(`Are you sure you want to delete "${subscription.name}"?`)
        ) {
            return;
        }

        try {
            await api.delete(`/subscriptions/${subscription.id}`);
            toast.success('Subscription deleted!');
            router.visit('/subscriptions');
        } catch (error) {
            console.error('Failed to delete subscription:', error);
            toast.error('Failed to delete subscription');
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Loading..." />
                <div className="p-6">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 w-64 rounded bg-muted" />
                        <div className="h-64 rounded-xl bg-muted" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!subscription) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Not Found" />
                <div className="p-6 text-center">
                    <p className="text-muted-foreground">
                        Subscription not found
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.visit('/subscriptions')}
                    >
                        Back to Subscriptions
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={subscription.name} />
            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit('/subscriptions')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-xl"
                            style={{
                                backgroundColor:
                                    subscription.color || '#8b5cf6',
                            }}
                        >
                            <DynamicIcon
                                name={subscription.icon}
                                fallback={CalendarClock}
                                className="h-7 w-7 text-white"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">
                                {subscription.name}
                            </h1>
                            <div className="flex items-center gap-2">
                                {subscription.is_active ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        Paused
                                    </span>
                                )}
                                {subscription.is_overdue && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-300">
                                        <AlertCircle className="h-3 w-3" />
                                        Overdue
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleProcessPayment}
                            disabled={!subscription.is_active}
                            title={
                                !subscription.is_active
                                    ? 'Activate subscription to process payment'
                                    : 'Manually record a payment'
                            }
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay Now
                        </Button>
                        <Button variant="outline" onClick={handleToggle}>
                            {subscription.is_active ? (
                                <>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pause
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Resume
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.visit(
                                    `/subscriptions/${subscription.id}/edit`,
                                )
                            }
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="animate-fade-in-up stagger-1 grid gap-4 opacity-0 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                        <CardContent className="p-6">
                            <p className="text-sm opacity-90">Amount</p>
                            <p className="mt-1 text-2xl font-bold">
                                {formatCurrency(
                                    subscription.amount,
                                    subscription.currency,
                                )}
                            </p>
                            <p className="text-sm opacity-75">
                                {billingCycleLabels[subscription.billing_cycle]}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">
                                Monthly Cost
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {formatCurrency(
                                    subscription.monthly_equivalent,
                                    subscription.currency,
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">
                                Yearly Cost
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {formatCurrency(
                                    subscription.yearly_total,
                                    subscription.currency,
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">
                                Next Payment
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {subscription.next_billing_date
                                    ? new Date(
                                          subscription.next_billing_date,
                                      ).toLocaleDateString()
                                    : 'N/A'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Details */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="animate-fade-in-up stagger-2 opacity-0">
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {subscription.description && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Description
                                    </p>
                                    <p>{subscription.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Start Date
                                    </p>
                                    <p>
                                        {new Date(
                                            subscription.start_date,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                {subscription.end_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            End Date
                                        </p>
                                        <p>
                                            {new Date(
                                                subscription.end_date,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Billing Day
                                    </p>
                                    <p>{subscription.billing_day || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Reminder
                                    </p>
                                    <p>
                                        {subscription.reminder_days_before} days
                                        before
                                    </p>
                                </div>
                            </div>

                            {subscription.merchant && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Merchant
                                    </p>
                                    <p>{subscription.merchant.name}</p>
                                </div>
                            )}

                            {subscription.category && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Category
                                    </p>
                                    <p>{subscription.category.name}</p>
                                </div>
                            )}

                            {subscription.payment_method && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Payment Method
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {subscription.payment_method_type ===
                                        'bank_account' ? (
                                            <>
                                                <Wallet className="h-4 w-4" />
                                                <span>
                                                    {
                                                        (
                                                            subscription.payment_method as {
                                                                name: string;
                                                            }
                                                        ).name
                                                    }
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="h-4 w-4" />
                                                <span>
                                                    {
                                                        (
                                                            subscription.payment_method as {
                                                                card_holder_name: string;
                                                            }
                                                        ).card_holder_name
                                                    }
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card className="animate-fade-in-up stagger-3 opacity-0">
                        <CardHeader>
                            <CardTitle>
                                Payment History ({transactions.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <p className="py-8 text-center text-muted-foreground">
                                    No payments recorded yet
                                </p>
                            ) : (
                                <div className="max-h-80 space-y-3 overflow-y-auto">
                                    {transactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {transaction.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        transaction.transaction_date,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-red-600">
                                                -
                                                {formatCurrency(
                                                    transaction.amount,
                                                    transaction.currency,
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
