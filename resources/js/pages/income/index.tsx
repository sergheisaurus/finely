import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { RecurringIncome, RecurringIncomeStats } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    Edit,
    Eye,
    Pause,
    Play,
    Plus,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Income',
        href: '/income',
    },
];

const frequencyLabels: Record<string, string> = {
    weekly: 'Weekly',
    bi_weekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
};

export default function IncomeIndex() {
    const [incomes, setIncomes] = useState<RecurringIncome[]>([]);
    const [stats, setStats] = useState<RecurringIncomeStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [incomesRes, statsRes] = await Promise.all([
                api.get('/recurring-incomes'),
                api.get('/recurring-incomes/stats'),
            ]);
            setIncomes(incomesRes.data.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch incomes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (income: RecurringIncome) => {
        try {
            await api.post(`/recurring-incomes/${income.id}/toggle`);
            toast.success(
                income.is_active ? 'Income paused' : 'Income resumed',
                {
                    description: `${income.name} has been ${income.is_active ? 'paused' : 'resumed'}.`,
                },
            );
            await fetchData();
        } catch (error) {
            console.error('Failed to toggle income:', error);
            toast.error('Failed to update income');
        }
    };

    const handleMarkReceived = async (income: RecurringIncome) => {
        try {
            await api.post(`/recurring-incomes/${income.id}/mark-received`);
            toast.success('Income marked as received!', {
                description: `${income.name} has been recorded.`,
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to mark income as received:', error);
            toast.error('Failed to record income');
        }
    };

    const handleDelete = async (income: RecurringIncome) => {
        if (
            !confirm(
                `Are you sure you want to delete "${income.name}"? This will not affect existing transactions.`,
            )
        ) {
            return;
        }

        try {
            await api.delete(`/recurring-incomes/${income.id}`);
            toast.success('Income deleted!', {
                description: `${income.name} has been removed.`,
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to delete income:', error);
            toast.error('Failed to delete income');
        }
    };

    const activeIncomes = incomes.filter((i) => i.is_active);
    const pausedIncomes = incomes.filter((i) => !i.is_active);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recurring Income" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl dark:from-white dark:to-slate-400">
                            Recurring Income
                        </h1>
                        <p className="text-muted-foreground">
                            Track your regular income sources
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/income/create')}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl hover:shadow-emerald-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Income
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="animate-fade-in-up stagger-1 hover-lift bg-gradient-to-br from-emerald-500 to-teal-600 text-white opacity-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Active Sources
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {stats?.active_count ?? 0}
                                    </p>
                                </div>
                                <TrendingUp className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-2 hover-lift bg-gradient-to-br from-blue-500 to-cyan-600 text-white opacity-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Monthly Income
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {formatCurrency(
                                            stats?.monthly_total ?? 0,
                                            'CHF',
                                        )}
                                    </p>
                                </div>
                                <TrendingUp className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-3 hover-lift bg-gradient-to-br from-amber-500 to-orange-600 text-white opacity-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Yearly Income
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {formatCurrency(
                                            stats?.yearly_total ?? 0,
                                            'CHF',
                                        )}
                                    </p>
                                </div>
                                <TrendingUp className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-4 hover-lift bg-gradient-to-br from-green-500 to-green-600 text-white opacity-0 sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Expected This Week
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {stats?.expected_this_week ?? 0}
                                    </p>
                                </div>
                                <Check className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {isLoading ? (
                    <div className="animate-fade-in-up stagger-5 grid gap-4 opacity-0 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-40 animate-pulse rounded-xl bg-muted"
                            />
                        ))}
                    </div>
                ) : incomes.length === 0 ? (
                    <Card className="animate-fade-in-up stagger-5 overflow-hidden opacity-0">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50">
                                <TrendingUp className="h-10 w-10 text-emerald-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No recurring income yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Start tracking your regular income sources
                            </p>
                            <Button
                                className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                onClick={() => router.visit('/income/create')}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Income
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {activeIncomes.length > 0 && (
                            <div className="animate-fade-in-up stagger-5 space-y-4 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl">
                                    Active Income
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {activeIncomes.map((income) => (
                                        <IncomeCard
                                            key={income.id}
                                            income={income}
                                            onToggle={handleToggle}
                                            onMarkReceived={handleMarkReceived}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {pausedIncomes.length > 0 && (
                            <div className="animate-fade-in-up stagger-6 space-y-4 opacity-0">
                                <h2 className="text-xl font-bold text-muted-foreground md:text-2xl">
                                    Paused Income
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {pausedIncomes.map((income) => (
                                        <IncomeCard
                                            key={income.id}
                                            income={income}
                                            onToggle={handleToggle}
                                            onMarkReceived={handleMarkReceived}
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

function IncomeCard({
    income,
    onToggle,
    onMarkReceived,
    onDelete,
}: {
    income: RecurringIncome;
    onToggle: (i: RecurringIncome) => void;
    onMarkReceived: (i: RecurringIncome) => void;
    onDelete: (i: RecurringIncome) => void;
}) {
    return (
        <Card
            className={`group hover-lift overflow-hidden transition-all duration-200 hover:shadow-md ${
                !income.is_active ? 'opacity-60' : ''
            }`}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                            style={{
                                backgroundColor: income.color || '#10b981',
                            }}
                        >
                            <DynamicIcon
                                name={income.icon}
                                fallback={TrendingUp}
                                className="h-6 w-6 text-white"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold">{income.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {frequencyLabels[income.frequency]}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-green-600">
                            +{formatCurrency(income.amount, income.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            ~
                            {formatCurrency(
                                income.monthly_equivalent,
                                income.currency,
                            )}
                            /mo
                        </p>
                    </div>
                </div>

                {income.source && (
                    <p className="mt-2 text-sm text-muted-foreground">
                        From: {income.source}
                    </p>
                )}

                {income.next_expected_date && income.is_active && (
                    <div className="mt-3 flex items-center gap-2">
                        {income.is_overdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                <AlertCircle className="h-3 w-3" />
                                Expected
                            </span>
                        ) : income.is_expected_soon ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                <Check className="h-3 w-3" />
                                Coming soon
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                Next:{' '}
                                {new Date(
                                    income.next_expected_date,
                                ).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-4 flex gap-1 border-t pt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit(`/income/${income.id}`)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            router.visit(`/income/${income.id}/edit`)
                        }
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    {income.is_active && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkReceived(income)}
                            className="text-green-600"
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggle(income)}
                    >
                        {income.is_active ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(income)}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
