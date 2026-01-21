import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Budget, BudgetImpact } from '@/types/finance';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    PiggyBank,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface BudgetIndicatorProps {
    categoryId: number | string | null;
    transactionAmount: number;
    transactionType: 'income' | 'expense' | 'transfer' | 'card_payment';
    currency?: string;
    className?: string;
}

export function BudgetIndicator({
    categoryId,
    transactionAmount,
    transactionType,
    className,
}: BudgetIndicatorProps) {
    const [budget, setBudget] = useState<Budget | null>(null);
    const [impact, setImpact] = useState<BudgetImpact | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Only show for expense transactions
        if (transactionType !== 'expense') {
            setBudget(null);
            setImpact(null);
            return;
        }

        const fetchBudgetForCategory = async () => {
            if (!categoryId) {
                // Check for overall budget
                setLoading(true);
                try {
                    const response = await api.get(
                        '/budgets/for-category?category_id=',
                    );
                    if (response.data.data) {
                        setBudget(response.data.data);
                        // Calculate impact
                        if (transactionAmount > 0) {
                            const impactRes = await api.get(
                                `/budgets/${response.data.data.id}/check-impact?amount=${transactionAmount}`,
                            );
                            setImpact(impactRes.data.data);
                        }
                    } else {
                        setBudget(null);
                        setImpact(null);
                    }
                } catch {
                    setBudget(null);
                    setImpact(null);
                } finally {
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            try {
                const response = await api.get(
                    `/budgets/for-category?category_id=${categoryId}`,
                );
                if (response.data.data) {
                    setBudget(response.data.data);
                    // Calculate impact if amount is set
                    if (transactionAmount > 0) {
                        const impactRes = await api.get(
                            `/budgets/${response.data.data.id}/check-impact?amount=${transactionAmount}`,
                        );
                        setImpact(impactRes.data.data);
                    }
                } else {
                    setBudget(null);
                    setImpact(null);
                }
            } catch {
                setBudget(null);
                setImpact(null);
            } finally {
                setLoading(false);
            }
        };

        fetchBudgetForCategory();
    }, [categoryId, transactionAmount, transactionType]);

    // Don't render anything for non-expense transactions
    if (transactionType !== 'expense') return null;

    // Show loading state
    if (loading) {
        return (
            <div
                className={cn(
                    'animate-pulse rounded-lg bg-muted p-3',
                    className,
                )}
            >
                <div className="h-4 w-32 rounded bg-muted-foreground/20" />
            </div>
        );
    }

    // No budget found
    if (!budget) return null;

    const progressWidth = Math.min(budget.spent_percentage, 100);
    const projectedWidth = impact
        ? Math.min(impact.projected_percentage, 100)
        : progressWidth;

    const getHealthColor = () => {
        if (impact?.will_be_over_budget || budget.is_over_budget)
            return 'bg-red-500';
        if (budget.budget_health === 'danger') return 'bg-orange-500';
        if (budget.budget_health === 'warning') return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStatusIcon = () => {
        if (impact?.will_be_over_budget) {
            return <AlertCircle className="h-4 w-4 text-red-500" />;
        }
        if (budget.is_over_budget) {
            return <AlertCircle className="h-4 w-4 text-red-500" />;
        }
        if (
            budget.budget_health === 'danger' ||
            budget.budget_health === 'warning'
        ) {
            return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        }
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    };

    return (
        <div
            className={cn(
                'rounded-lg border p-3 transition-colors',
                impact?.will_be_over_budget &&
                    'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
                !impact?.will_be_over_budget &&
                    budget.is_over_budget &&
                    'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
                !impact?.will_be_over_budget &&
                    !budget.is_over_budget &&
                    budget.budget_health === 'warning' &&
                    'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30',
                className,
            )}
        >
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-6 w-6 items-center justify-center rounded"
                        style={{ backgroundColor: budget.color || '#4f46e5' }}
                    >
                        <PiggyBank className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{budget.name}</span>
                </div>
                {getStatusIcon()}
            </div>

            {/* Progress bar showing current + projected */}
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                {/* Show projected spending as lighter color if it differs */}
                {impact &&
                    impact.projected_percentage > budget.spent_percentage && (
                        <div
                            className={cn(
                                'h-full opacity-40 transition-all duration-300',
                                getHealthColor(),
                            )}
                            style={{ width: `${projectedWidth}%` }}
                        />
                    )}
                <div
                    className={cn(
                        '-mt-2 h-full transition-all duration-300',
                        impact &&
                            impact.projected_percentage >
                                budget.spent_percentage &&
                            '-mt-2',
                        getHealthColor(),
                    )}
                    style={{ width: `${progressWidth}%` }}
                />
            </div>

            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                    {formatCurrency(
                        budget.current_period_spent,
                        budget.currency,
                    )}{' '}
                    / {formatCurrency(budget.effective_budget, budget.currency)}
                </span>
                <span className="text-muted-foreground">
                    {budget.spent_percentage.toFixed(0)}% used
                </span>
            </div>

            {/* Warning message if transaction will push over budget */}
            {impact?.will_be_over_budget && !budget.is_over_budget && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>
                        This will exceed budget by{' '}
                        {formatCurrency(impact.exceeds_by, budget.currency)}
                    </span>
                </div>
            )}

            {/* Info if already over budget */}
            {budget.is_over_budget && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>
                        Already over budget by{' '}
                        {formatCurrency(
                            Math.abs(budget.remaining_amount),
                            budget.currency,
                        )}
                    </span>
                </div>
            )}

            {/* Show projected remaining for non-warning states */}
            {impact &&
                !impact.will_be_over_budget &&
                !budget.is_over_budget &&
                transactionAmount > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        After this:{' '}
                        {formatCurrency(
                            impact.projected_remaining,
                            budget.currency,
                        )}{' '}
                        remaining
                    </div>
                )}
        </div>
    );
}
