import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { Budget, BudgetStats } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    Edit,
    Eye,
    Pause,
    PiggyBank,
    Play,
    Plus,
    RefreshCw,
    Trash2,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Budgets',
        href: '/budgets',
    },
];

const periodLabels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
};

const healthColors: Record<string, string> = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-orange-500',
    exceeded: 'bg-red-500',
};

const healthTextColors: Record<string, string> = {
    healthy: 'text-green-700 dark:text-green-300',
    warning: 'text-yellow-700 dark:text-yellow-300',
    danger: 'text-orange-700 dark:text-orange-300',
    exceeded: 'text-red-700 dark:text-red-300',
};

const healthBgColors: Record<string, string> = {
    healthy: 'bg-green-100 dark:bg-green-900/50',
    warning: 'bg-yellow-100 dark:bg-yellow-900/50',
    danger: 'bg-orange-100 dark:bg-orange-900/50',
    exceeded: 'bg-red-100 dark:bg-red-900/50',
};

export default function BudgetsIndex() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [stats, setStats] = useState<BudgetStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [budgetsRes, statsRes] = await Promise.all([
                api.get('/budgets'),
                api.get('/budgets/stats'),
            ]);
            setBudgets(budgetsRes.data.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch budgets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (budget: Budget) => {
        try {
            await api.post(`/budgets/${budget.id}/toggle`);
            toast.success(
                budget.is_active ? 'Budget paused' : 'Budget resumed',
                {
                    description: `${budget.name} has been ${budget.is_active ? 'paused' : 'resumed'}.`,
                },
            );
            await fetchData();
        } catch (error) {
            console.error('Failed to toggle budget:', error);
            toast.error('Failed to update budget');
        }
    };

    const handleRefresh = async (budget: Budget) => {
        try {
            await api.post(`/budgets/${budget.id}/refresh`);
            toast.success('Budget refreshed!', {
                description: `Spending for ${budget.name} has been recalculated.`,
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to refresh budget:', error);
            toast.error('Failed to refresh budget');
        }
    };

    const handleDelete = async (budget: Budget) => {
        if (
            !confirm(
                `Are you sure you want to delete "${budget.name}"? This action cannot be undone.`,
            )
        ) {
            return;
        }

        try {
            await api.delete(`/budgets/${budget.id}`);
            toast.success('Budget deleted!', {
                description: `${budget.name} has been removed.`,
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to delete budget:', error);
            toast.error('Failed to delete budget');
        }
    };

    const activeBudgets = budgets.filter((b) => b.is_active);
    const pausedBudgets = budgets.filter((b) => !b.is_active);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Budgets" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
                    <div>
                        <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                            Budgets
                        </h1>
                        <p className="text-muted-foreground">
                            Track and manage your spending limits
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/budgets/create')}
                        className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Budget
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="animate-fade-in-up stagger-1 opacity-0 bg-gradient-to-br from-indigo-500 to-blue-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Active Budgets
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {stats?.active_count ?? 0}
                                    </p>
                                </div>
                                <PiggyBank className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-2 opacity-0 bg-gradient-to-br from-blue-500 to-cyan-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Total Budgeted
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {formatCurrency(
                                            stats?.total_budgeted ?? 0,
                                            'CHF',
                                        )}
                                    </p>
                                </div>
                                <Wallet className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-3 opacity-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Total Spent
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {formatCurrency(
                                            stats?.total_spent ?? 0,
                                            'CHF',
                                        )}
                                    </p>
                                    {stats && stats.total_budgeted > 0 && (
                                        <p className="text-xs opacity-80">
                                            {stats.overall_percentage.toFixed(1)}% of budget
                                        </p>
                                    )}
                                </div>
                                <TrendingUp className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-4 opacity-0 bg-gradient-to-br from-red-500 to-rose-600 text-white hover-lift sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Over Budget
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {stats?.over_budget_count ?? 0}
                                    </p>
                                    {(stats?.warning_count ?? 0) > 0 && (
                                        <p className="text-xs opacity-80">
                                            +{stats?.warning_count} near limit
                                        </p>
                                    )}
                                </div>
                                <AlertTriangle className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up stagger-5 opacity-0">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-48 animate-pulse rounded-xl bg-muted"
                            />
                        ))}
                    </div>
                ) : budgets.length === 0 ? (
                    <Card className="animate-fade-in-up stagger-5 opacity-0 overflow-hidden">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50">
                                <PiggyBank className="h-10 w-10 text-indigo-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No budgets yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Start tracking your spending with budgets
                            </p>
                            <Button
                                className="mt-4 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
                                onClick={() => router.visit('/budgets/create')}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Budget
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {activeBudgets.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-5 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl">
                                    Active Budgets
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {activeBudgets.map((budget) => (
                                        <BudgetCard
                                            key={budget.id}
                                            budget={budget}
                                            onToggle={handleToggle}
                                            onRefresh={handleRefresh}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {pausedBudgets.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-6 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl text-muted-foreground">
                                    Paused Budgets
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {pausedBudgets.map((budget) => (
                                        <BudgetCard
                                            key={budget.id}
                                            budget={budget}
                                            onToggle={handleToggle}
                                            onRefresh={handleRefresh}
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

function BudgetCard({
    budget,
    onToggle,
    onRefresh,
    onDelete,
}: {
    budget: Budget;
    onToggle: (b: Budget) => void;
    onRefresh: (b: Budget) => void;
    onDelete: (b: Budget) => void;
}) {
    const progressColor = healthColors[budget.budget_health] || 'bg-gray-500';
    const progressWidth = Math.min(100, budget.spent_percentage);

    return (
        <Card
            className={`group transition-all duration-200 hover:shadow-md hover-lift overflow-hidden ${
                !budget.is_active ? 'opacity-60' : ''
            }`}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                            style={{
                                backgroundColor: budget.color || '#4f46e5',
                            }}
                        >
                            <DynamicIcon
                                name={budget.icon}
                                fallback={PiggyBank}
                                className="h-6 w-6 text-white"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold">{budget.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {periodLabels[budget.period]}
                                </span>
                                {budget.category && (
                                    <span className="text-xs text-muted-foreground">
                                        • {budget.category.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">
                            {formatCurrency(budget.effective_budget, budget.currency)}
                        </p>
                        {budget.rollover_amount > 0 && (
                            <p className="text-xs text-muted-foreground">
                                +{formatCurrency(budget.rollover_amount, budget.currency)} rollover
                            </p>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                            {formatCurrency(budget.current_period_spent, budget.currency)} spent
                        </span>
                        <span className={healthTextColors[budget.budget_health]}>
                            {budget.spent_percentage.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${progressWidth}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                            {formatCurrency(budget.remaining_amount, budget.currency)} remaining
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {budget.days_left_in_period} days left
                        </span>
                    </div>
                </div>

                {/* Health Status */}
                {budget.is_active && (
                    <div className="mt-3 flex items-center gap-2">
                        {budget.is_over_budget ? (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${healthBgColors.exceeded} ${healthTextColors.exceeded}`}>
                                <AlertCircle className="h-3 w-3" />
                                Over budget
                            </span>
                        ) : budget.is_near_limit ? (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${healthBgColors.warning} ${healthTextColors.warning}`}>
                                <AlertTriangle className="h-3 w-3" />
                                Near limit
                            </span>
                        ) : budget.will_exceed ? (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${healthBgColors.danger} ${healthTextColors.danger}`}>
                                <TrendingUp className="h-3 w-3" />
                                Projected to exceed
                            </span>
                        ) : (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${healthBgColors.healthy} ${healthTextColors.healthy}`}>
                                On track
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-4 flex gap-1 border-t pt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit(`/budgets/${budget.id}`)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit(`/budgets/${budget.id}/edit`)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRefresh(budget)}
                        title="Refresh spending"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggle(budget)}
                    >
                        {budget.is_active ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(budget)}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
