import { MarkReceivedModal } from '@/components/finance/mark-received-modal';
import { TransactionDeductionsModal } from '@/components/finance/transaction-deductions-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { RecurringIncome, Transaction } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    Edit,
    Pause,
    Play,
    Trash2,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const frequencyLabels: Record<string, string> = {
    weekly: 'Weekly',
    bi_weekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
};

export default function IncomeView({ incomeId }: { incomeId: string }) {
    const [income, setIncome] = useState<RecurringIncome | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMarkReceived, setShowMarkReceived] = useState(false);
    const [selectedTransaction, setSelectedTransaction] =
        useState<Transaction | null>(null);
    const [showDeductions, setShowDeductions] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Income',
            href: '/income',
        },
        {
            title: income?.name || 'Loading...',
            href: `/income/${incomeId}`,
        },
    ];

    const fetchData = useCallback(async () => {
        try {
            const [incomeRes, transRes] = await Promise.all([
                api.get(`/recurring-incomes/${incomeId}`),
                api.get(`/recurring-incomes/${incomeId}/transactions`),
            ]);
            setIncome(incomeRes.data.data);
            setTransactions(transRes.data.data);
        } catch (error) {
            console.error('Failed to fetch income:', error);
            toast.error('Failed to load income');
        } finally {
            setIsLoading(false);
        }
    }, [incomeId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggle = async () => {
        if (!income) return;
        try {
            await api.post(`/recurring-incomes/${income.id}/toggle`);
            toast.success(
                income.is_active ? 'Income paused' : 'Income resumed',
            );
            await fetchData();
        } catch (error) {
            console.error('Failed to toggle income:', error);
            toast.error('Failed to update income');
        }
    };

    const handleMarkReceived = () => {
        setShowMarkReceived(true);
    };

    const handleTransactionClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setShowDeductions(true);
    };

    const handleDelete = async () => {
        if (!income) return;
        if (!confirm(`Are you sure you want to delete "${income.name}"?`)) {
            return;
        }

        try {
            await api.delete(`/recurring-incomes/${income.id}`);
            toast.success('Income deleted!');
            router.visit('/income');
        } catch (error) {
            console.error('Failed to delete income:', error);
            toast.error('Failed to delete income');
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

    if (!income) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Not Found" />
                <div className="p-6 text-center">
                    <p className="text-muted-foreground">Income not found</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.visit('/income')}
                    >
                        Back to Income
                    </Button>
                </div>
            </AppLayout>
        );
    }

    const gross = Number(income.amount) || 0;
    const computedAdditions = (income.additions || []).map((a) => {
        const calcAmount =
            a.type === 'percentage'
                ? gross * ((Number(a.value || a.amount) || 0) / 100)
                : Number(a.value || a.amount) || 0;
        const hasOverride =
            a.type === 'percentage' &&
            a.amount !== undefined &&
            Math.abs(a.amount - calcAmount) > 0.001;
        return {
            calcAmount,
            finalAmount: hasOverride ? a.amount : calcAmount,
            isOverridden: hasOverride,
        };
    });
    const totalAdditions = computedAdditions.reduce(
        (sum, val) => sum + val.finalAmount,
        0,
    );

    const grossPlusAdditions = gross + totalAdditions;

    const computedDeductions = (income.deductions || []).map((d) => {
        const calcAmount =
            d.type === 'percentage'
                ? grossPlusAdditions *
                  ((Number(d.value || d.amount) || 0) / 100)
                : Number(d.value || d.amount) || 0;
        const hasOverride =
            d.type === 'percentage' &&
            d.amount !== undefined &&
            Math.abs(d.amount - calcAmount) > 0.001;
        return {
            calcAmount,
            finalAmount: hasOverride ? d.amount : calcAmount,
            isOverridden: hasOverride,
        };
    });
    const totalDeductions = computedDeductions.reduce(
        (sum, val) => sum + val.finalAmount,
        0,
    );
    const netAmount = gross + totalAdditions - totalDeductions;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={income.name} />
            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit('/income')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-xl"
                            style={{
                                backgroundColor: income.color || '#10b981',
                            }}
                        >
                            <DynamicIcon
                                name={income.icon}
                                fallback={TrendingUp}
                                className="h-7 w-7 text-white"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">
                                {income.name}
                            </h1>
                            <div className="flex items-center gap-2">
                                {income.is_active ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        Paused
                                    </span>
                                )}
                                {income.is_overdue && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                        <AlertCircle className="h-3 w-3" />
                                        Expected
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {income.is_active && (
                            <Button
                                onClick={handleMarkReceived}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Mark Received
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleToggle}>
                            {income.is_active ? (
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
                                router.visit(`/income/${income.id}/edit`)
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
                    <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <CardContent className="p-6">
                            <p className="text-sm opacity-90">Amount</p>
                            <p className="mt-1 text-2xl font-bold">
                                {formatCurrency(income.amount, income.currency)}
                            </p>
                            <p className="text-sm opacity-75">
                                {frequencyLabels[income.frequency]}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="flex items-center justify-between text-sm text-muted-foreground">
                                Monthly Income{' '}
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground uppercase">
                                    Net
                                </span>
                            </p>
                            <p className="mt-1 text-2xl font-bold text-green-600">
                                +
                                {formatCurrency(
                                    income.monthly_equivalent,
                                    income.currency,
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="flex items-center justify-between text-sm text-muted-foreground">
                                Yearly Income{' '}
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground uppercase">
                                    Net
                                </span>
                            </p>
                            <p className="mt-1 text-2xl font-bold text-green-600">
                                +
                                {formatCurrency(
                                    income.yearly_total,
                                    income.currency,
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">
                                Next Expected
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {income.next_expected_date
                                    ? new Date(
                                          income.next_expected_date,
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
                            {income.description && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Description
                                    </p>
                                    <p>{income.description}</p>
                                </div>
                            )}

                            {income.source && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Source
                                    </p>
                                    <p>{income.source}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Start Date
                                    </p>
                                    <p>
                                        {new Date(
                                            income.start_date,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                {income.end_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            End Date
                                        </p>
                                        <p>
                                            {new Date(
                                                income.end_date,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Payment Day
                                    </p>
                                    <p>{income.payment_day || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Payments
                                    </p>
                                    <p>{transactions.length}</p>
                                </div>
                            </div>

                            {income.category && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Category
                                    </p>
                                    <p>{income.category.name}</p>
                                </div>
                            )}

                            {income.to_account && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Deposit Account
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Wallet className="h-4 w-4" />
                                        <span>{income.to_account.name}</span>
                                    </div>
                                </div>
                            )}

                            {((income.additions &&
                                income.additions.length > 0) ||
                                (income.deductions &&
                                    income.deductions.length > 0)) && (
                                <div className="mt-6 overflow-x-auto rounded-lg border border-border/50">
                                    <div className="min-w-[500px]">
                                        <div className="grid grid-cols-[1fr_120px_130px_20px] gap-2 border-b bg-muted/60 p-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            <div>Description</div>
                                            <div className="text-right">
                                                Rate / Basis
                                            </div>
                                            <div className="text-right">
                                                Amount
                                            </div>
                                            <div></div>
                                        </div>
                                        <div className="p-3">
                                            <div className="grid grid-cols-[1fr_120px_130px_20px] items-center gap-2 py-1.5 text-sm">
                                                <div className="font-medium">
                                                    Salaire de base
                                                </div>
                                                <div className="text-right text-muted-foreground">
                                                    -
                                                </div>
                                                <div className="text-right font-medium">
                                                    {formatCurrency(
                                                        gross,
                                                        income.currency,
                                                    )}
                                                </div>
                                                <div></div>
                                            </div>

                                            {income.additions &&
                                                income.additions.length > 0 && (
                                                    <div className="mt-3">
                                                        <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                            Allocations /
                                                            Prestations
                                                        </div>
                                                        {income.additions.map(
                                                            (adj, i) => {
                                                                const {
                                                                    calcAmount,
                                                                    finalAmount,
                                                                    isOverridden,
                                                                } =
                                                                    computedAdditions[
                                                                        i
                                                                    ];
                                                                return (
                                                                    <div
                                                                        key={`add-${i}`}
                                                                        className="grid grid-cols-[1fr_120px_130px_20px] items-center gap-2 py-1 text-sm"
                                                                    >
                                                                        <div>
                                                                            {
                                                                                adj.name
                                                                            }
                                                                        </div>
                                                                        <div className="text-right text-xs text-muted-foreground">
                                                                            {adj.type ===
                                                                            'percentage'
                                                                                ? `${adj.value || adj.amount}%`
                                                                                : '-'}
                                                                        </div>
                                                                        <div className="relative flex flex-col items-end justify-center pr-1">
                                                                            <div className="text-right font-medium text-green-600">
                                                                                +
                                                                                {formatCurrency(
                                                                                    finalAmount,
                                                                                    income.currency,
                                                                                )}
                                                                            </div>
                                                                            {isOverridden && (
                                                                                <span className="-mt-1 text-[10px] whitespace-nowrap text-muted-foreground">
                                                                                    Calc:{' '}
                                                                                    {calcAmount.toFixed(
                                                                                        2,
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div></div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}

                                            <div className="-mx-3 my-3 grid grid-cols-[1fr_120px_130px_20px] items-center gap-2 border-y border-border bg-muted/30 px-3 py-2 text-sm font-bold">
                                                <div>Salaire Brut (Gross)</div>
                                                <div className="text-right text-muted-foreground">
                                                    -
                                                </div>
                                                <div className="pr-1 text-right text-green-600">
                                                    {formatCurrency(
                                                        gross + totalAdditions,
                                                        income.currency,
                                                    )}
                                                </div>
                                                <div></div>
                                            </div>

                                            {income.deductions &&
                                                income.deductions.length >
                                                    0 && (
                                                    <div className="mt-3">
                                                        <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                            Cotisations Sociales
                                                            / Impôts
                                                        </div>
                                                        {income.deductions.map(
                                                            (adj, i) => {
                                                                const {
                                                                    calcAmount,
                                                                    finalAmount,
                                                                    isOverridden,
                                                                } =
                                                                    computedDeductions[
                                                                        i
                                                                    ];
                                                                return (
                                                                    <div
                                                                        key={`ded-${i}`}
                                                                        className="grid grid-cols-[1fr_120px_130px_20px] items-center gap-2 py-1 text-sm"
                                                                    >
                                                                        <div>
                                                                            {
                                                                                adj.name
                                                                            }
                                                                        </div>
                                                                        <div className="text-right text-xs text-muted-foreground">
                                                                            {adj.type ===
                                                                            'percentage'
                                                                                ? `${adj.value || adj.amount}%`
                                                                                : '-'}
                                                                        </div>
                                                                        <div className="relative flex flex-col items-end justify-center pr-1">
                                                                            <div className="text-right font-medium text-red-600">
                                                                                -
                                                                                {formatCurrency(
                                                                                    finalAmount,
                                                                                    income.currency,
                                                                                )}
                                                                            </div>
                                                                            {isOverridden && (
                                                                                <span className="-mt-1 text-[10px] whitespace-nowrap text-muted-foreground">
                                                                                    Calc:{' '}
                                                                                    {calcAmount.toFixed(
                                                                                        2,
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div></div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}

                                            <div className="mt-4 grid grid-cols-[1fr_120px_130px_20px] items-center gap-2 border-t-[3px] border-border pt-3 text-base font-bold">
                                                <div>Salaire Net Estimé</div>
                                                <div className="text-right text-muted-foreground">
                                                    -
                                                </div>
                                                <div className="pr-1 text-right">
                                                    {formatCurrency(
                                                        netAmount,
                                                        income.currency,
                                                    )}
                                                </div>
                                                <div></div>
                                            </div>
                                        </div>
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
                                    No payments received yet
                                </p>
                            ) : (
                                <div className="max-h-80 space-y-3 overflow-y-auto">
                                    {transactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                            onClick={() =>
                                                handleTransactionClick(
                                                    transaction,
                                                )
                                            }
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
                                                {transaction.metadata
                                                    ?.salary_breakdown && (
                                                    <p className="text-xs text-blue-500">
                                                        Click to view breakdown
                                                    </p>
                                                )}
                                            </div>
                                            <p className="font-semibold text-green-600">
                                                +
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

            {/* Modals */}
            <MarkReceivedModal
                income={income}
                open={showMarkReceived}
                onOpenChange={setShowMarkReceived}
                onSuccess={fetchData}
            />
            <TransactionDeductionsModal
                transaction={selectedTransaction}
                open={showDeductions}
                onOpenChange={setShowDeductions}
            />
        </AppLayout>
    );
}
