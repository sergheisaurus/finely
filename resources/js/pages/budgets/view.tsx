import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { Budget, BudgetBreakdown, Transaction } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    Edit,
    Pause,
    PiggyBank,
    Play,
    RefreshCw,
    Trash2,
    TrendingDown,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const periodLabels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
};

const healthConfig: Record<
    string,
    { label: string; icon: typeof CheckCircle; className: string }
> = {
    healthy: {
        label: 'On Track',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    },
    warning: {
        label: 'Near Limit',
        icon: AlertTriangle,
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    },
    danger: {
        label: 'At Risk',
        icon: AlertCircle,
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    },
    exceeded: {
        label: 'Over Budget',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    },
};

export default function BudgetView({ budgetId }: { budgetId: string }) {
    const [budget, setBudget] = useState<Budget | null>(null);
    const [breakdown, setBreakdown] = useState<BudgetBreakdown[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Budgets',
            href: '/budgets',
        },
        {
            title: budget?.name || 'Loading...',
            href: `/budgets/${budgetId}`,
        },
    ];

    const fetchData = useCallback(async () => {
        try {
            const [budgetRes, breakdownRes] = await Promise.all([
                api.get(`/budgets/${budgetId}`),
                api.get(`/budgets/${budgetId}/breakdown`),
            ]);
            setBudget(budgetRes.data.data);
            setBreakdown(breakdownRes.data.data || []);

            // Fetch recent transactions for this budget
            if (budgetRes.data.data) {
                const b = budgetRes.data.data;
                const transRes = await api.get(
                    `/transactions?type=expense&from_date=${b.current_period_start}&to_date=${b.current_period_end}${b.category_id ? `&category_id=${b.category_id}` : ''}&per_page=10`,
                );
                setTransactions(transRes.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch budget:', error);
            toast.error('Failed to load budget');
        } finally {
            setIsLoading(false);
        }
    }, [budgetId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggle = async () => {
        if (!budget) return;
        try {
            await api.post(`/budgets/${budget.id}/toggle`);
            toast.success(budget.is_active ? 'Budget paused' : 'Budget resumed');
            await fetchData();
        } catch (error) {
            console.error('Failed to toggle budget:', error);
            toast.error('Failed to update budget');
        }
    };

    const handleRefresh = async () => {
        if (!budget) return;
        setIsRefreshing(true);
        try {
            await api.post(`/budgets/${budget.id}/refresh`);
            toast.success('Budget spending updated');
            await fetchData();
        } catch (error) {
            console.error('Failed to refresh budget:', error);
            toast.error('Failed to refresh budget');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDelete = async () => {
        if (!budget) return;
        if (!confirm(`Are you sure you want to delete "${budget.name}"?`)) {
            return;
        }

        try {
            await api.delete(`/budgets/${budget.id}`);
            toast.success('Budget deleted!');
            router.visit('/budgets');
        } catch (error) {
            console.error('Failed to delete budget:', error);
            toast.error('Failed to delete budget');
        }
    };

    const getHealthColor = (health: string) => {
        switch (health) {
            case 'healthy':
                return 'bg-green-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'danger':
                return 'bg-orange-500';
            case 'exceeded':
                return 'bg-red-500';
            default:
                return 'bg-slate-500';
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Loading..." />
                <div className="p-6">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 w-64 rounded bg-muted" />
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-32 rounded-xl bg-muted" />
                            ))}
                        </div>
                        <div className="h-64 rounded-xl bg-muted" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!budget) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Not Found" />
                <div className="p-6 text-center">
                    <p className="text-muted-foreground">Budget not found</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.visit('/budgets')}
                    >
                        Back to Budgets
                    </Button>
                </div>
            </AppLayout>
        );
    }

    const healthInfo = healthConfig[budget.budget_health] || healthConfig.healthy;
    const HealthIcon = healthInfo.icon;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={budget.name} />
            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit('/budgets')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-xl"
                            style={{
                                backgroundColor: budget.color || '#4f46e5',
                            }}
                        >
                            <DynamicIcon
                                name={budget.icon}
                                fallback={PiggyBank}
                                className="h-7 w-7 text-white"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">
                                {budget.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2">
                                {budget.is_active ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        Paused
                                    </span>
                                )}
                                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                                    {periodLabels[budget.period]}
                                </span>
                                {budget.category && (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        {budget.category.name}
                                    </span>
                                )}
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${healthInfo.className}`}
                                >
                                    <HealthIcon className="h-3 w-3" />
                                    {healthInfo.label}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                        <Button variant="outline" onClick={handleToggle}>
                            {budget.is_active ? (
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
                                router.visit(`/budgets/${budget.id}/edit`)
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

                {/* Period Info */}
                <p className="text-sm text-muted-foreground animate-fade-in-up">
                    Current period:{' '}
                    <span className="font-medium">
                        {new Date(budget.current_period_start).toLocaleDateString()} -{' '}
                        {new Date(budget.current_period_end).toLocaleDateString()}
                    </span>
                    {budget.days_left_in_period !== undefined && (
                        <span className="ml-2">
                            ({budget.days_left_in_period} days left)
                        </span>
                    )}
                </p>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up stagger-1 opacity-0">
                    <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                        <CardContent className="p-6">
                            <p className="text-sm opacity-90">Budget Amount</p>
                            <p className="mt-1 text-2xl font-bold">
                                {formatCurrency(budget.effective_budget, budget.currency)}
                            </p>
                            {budget.rollover_amount > 0 && (
                                <p className="text-xs opacity-75">
                                    Includes {formatCurrency(budget.rollover_amount, budget.currency)} rollover
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">
                                Current Spending
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {formatCurrency(
                                    budget.current_period_spent,
                                    budget.currency,
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {budget.spent_percentage.toFixed(1)}% of budget
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">
                                Remaining
                            </p>
                            <p
                                className={`mt-1 text-2xl font-bold ${budget.remaining_amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                            >
                                {formatCurrency(budget.remaining_amount, budget.currency)}
                            </p>
                            {budget.remaining_amount < 0 && (
                                <p className="text-xs text-red-500">Over budget!</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Section */}
                <Card className="animate-fade-in-up stagger-2 opacity-0">
                    <CardHeader>
                        <CardTitle>Budget Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>
                                    {formatCurrency(budget.current_period_spent, budget.currency)}{' '}
                                    spent
                                </span>
                                <span>
                                    {formatCurrency(budget.effective_budget, budget.currency)}{' '}
                                    total
                                </span>
                            </div>
                            <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${getHealthColor(budget.budget_health)}`}
                                    style={{
                                        width: `${Math.min(budget.spent_percentage, 100)}%`,
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{budget.spent_percentage.toFixed(1)}% used</span>
                                {budget.alert_threshold > 0 && (
                                    <span>Alert at {budget.alert_threshold}%</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Budget Health & Projections */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="animate-fade-in-up stagger-3 opacity-0">
                        <CardHeader>
                            <CardTitle>Budget Health</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-full ${healthInfo.className}`}
                                >
                                    <HealthIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">
                                        {healthInfo.label}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {budget.spent_percentage.toFixed(1)}% of budget used
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Daily Avg Spent
                                    </p>
                                    <p className="font-semibold">
                                        {formatCurrency(budget.daily_avg_spent, budget.currency)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Daily Avg Available
                                    </p>
                                    <p className="font-semibold">
                                        {formatCurrency(
                                            budget.daily_avg_remaining,
                                            budget.currency,
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Projected Spending
                                        </p>
                                        <p className="font-semibold">
                                            {formatCurrency(
                                                budget.projected_spending,
                                                budget.currency,
                                            )}
                                        </p>
                                    </div>
                                    {budget.will_exceed ? (
                                        <div className="flex items-center gap-1 text-red-600">
                                            <TrendingUp className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                Will exceed
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-green-600">
                                            <TrendingDown className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                On track
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {budget.description && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Description
                                    </p>
                                    <p className="mt-1">{budget.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Spending Breakdown */}
                    <Card className="animate-fade-in-up stagger-4 opacity-0">
                        <CardHeader>
                            <CardTitle>
                                Spending by{' '}
                                {budget.category_id ? 'Merchant' : 'Category'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {breakdown.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No spending recorded yet
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {breakdown.map((item, index) => {
                                        const percentage =
                                            budget.current_period_spent > 0
                                                ? (item.amount / budget.current_period_spent) * 100
                                                : 0;
                                        return (
                                            <div
                                                key={item.id || index}
                                                className="flex items-center gap-3"
                                            >
                                                <div
                                                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                                                    style={{
                                                        backgroundColor:
                                                            item.color || '#6366f1',
                                                    }}
                                                >
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="h-6 w-6 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <DynamicIcon
                                                            name={item.icon}
                                                            fallback={PiggyBank}
                                                            className="h-5 w-5 text-white"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium truncate">
                                                            {item.name || 'Uncategorized'}
                                                        </p>
                                                        <p className="font-semibold">
                                                            {formatCurrency(
                                                                item.amount,
                                                                budget.currency,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            {item.count} transaction
                                                            {item.count !== 1 ? 's' : ''}
                                                        </span>
                                                        <span>{percentage.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Settings Info */}
                <Card className="animate-fade-in-up stagger-5 opacity-0">
                    <CardHeader>
                        <CardTitle>Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Start Date</p>
                                <p className="font-medium">
                                    {new Date(budget.start_date).toLocaleDateString()}
                                </p>
                            </div>
                            {budget.end_date && (
                                <div>
                                    <p className="text-sm text-muted-foreground">End Date</p>
                                    <p className="font-medium">
                                        {new Date(budget.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Rollover Unused
                                </p>
                                <p className="font-medium">
                                    {budget.rollover_unused ? 'Yes' : 'No'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Alert Threshold
                                </p>
                                <p className="font-medium">{budget.alert_threshold}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="animate-fade-in-up stagger-6 opacity-0">
                    <CardHeader>
                        <CardTitle>Recent Transactions ({transactions.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No transactions in this period
                            </p>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() =>
                                            router.visit(
                                                `/journal/${transaction.id}/edit`,
                                            )
                                        }
                                    >
                                        <div className="flex items-center gap-3">
                                            {transaction.category && (
                                                <div
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                                                    style={{
                                                        backgroundColor:
                                                            transaction.category.color ||
                                                            '#6366f1',
                                                    }}
                                                >
                                                    <DynamicIcon
                                                        name={transaction.category.icon}
                                                        fallback={PiggyBank}
                                                        className="h-4 w-4 text-white"
                                                    />
                                                </div>
                                            )}
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
                                        </div>
                                        <p className="font-semibold text-red-600">
                                            -{formatCurrency(transaction.amount, transaction.currency)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
