import { formatCurrency } from '@/lib/format';
import type { Budget } from '@/types/finance';
import { cn } from '@/lib/utils';
import { AlertTriangle, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';

interface BudgetAlertProps {
    budgets: Budget[];
    className?: string;
    dismissible?: boolean;
}

export function BudgetAlert({
    budgets,
    className,
    dismissible = true,
}: BudgetAlertProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || budgets.length === 0) return null;

    const overBudget = budgets.filter((b) => b.is_over_budget);
    const nearLimit = budgets.filter((b) => b.is_near_limit && !b.is_over_budget);

    if (overBudget.length === 0 && nearLimit.length === 0) return null;

    return (
        <div className={cn('space-y-2', className)}>
            {overBudget.length > 0 && (
                <div className="relative flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-red-800 dark:text-red-200">
                            {overBudget.length === 1
                                ? 'Budget exceeded'
                                : `${overBudget.length} budgets exceeded`}
                        </p>
                        <div className="mt-1 space-y-1">
                            {overBudget.slice(0, 3).map((budget) => (
                                <button
                                    key={budget.id}
                                    onClick={() => router.visit(`/budgets/${budget.id}`)}
                                    className="block text-sm text-red-700 dark:text-red-300 hover:underline"
                                >
                                    {budget.name}: {formatCurrency(Math.abs(budget.remaining_amount), budget.currency)} over
                                </button>
                            ))}
                            {overBudget.length > 3 && (
                                <button
                                    onClick={() => router.visit('/budgets')}
                                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                                >
                                    +{overBudget.length - 3} more
                                </button>
                            )}
                        </div>
                    </div>
                    {dismissible && (
                        <button
                            onClick={() => setDismissed(true)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            {nearLimit.length > 0 && (
                <div className="relative flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/50">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            {nearLimit.length === 1
                                ? 'Budget near limit'
                                : `${nearLimit.length} budgets near limit`}
                        </p>
                        <div className="mt-1 space-y-1">
                            {nearLimit.slice(0, 3).map((budget) => (
                                <button
                                    key={budget.id}
                                    onClick={() => router.visit(`/budgets/${budget.id}`)}
                                    className="block text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
                                >
                                    {budget.name}: {budget.spent_percentage.toFixed(0)}% used
                                </button>
                            ))}
                            {nearLimit.length > 3 && (
                                <button
                                    onClick={() => router.visit('/budgets')}
                                    className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
                                >
                                    +{nearLimit.length - 3} more
                                </button>
                            )}
                        </div>
                    </div>
                    {dismissible && overBudget.length === 0 && (
                        <button
                            onClick={() => setDismissed(true)}
                            className="text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-200"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

interface BudgetAlertBannerProps {
    className?: string;
}

export function BudgetAlertBanner({ className }: BudgetAlertBannerProps) {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    // This component fetches its own data
    useState(() => {
        const fetchBudgets = async () => {
            try {
                const { default: api } = await import('@/lib/api');
                const response = await api.get('/budgets/health');
                setBudgets(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch budget health:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBudgets();
    });

    if (loading || budgets.length === 0) return null;

    return <BudgetAlert budgets={budgets} className={className} />;
}
