import { formatCurrency } from '@/lib/format';
import type { Budget } from '@/types/finance';
import { cn } from '@/lib/utils';

interface BudgetProgressProps {
    budget: Budget;
    showDetails?: boolean;
    compact?: boolean;
    className?: string;
}

const healthColors: Record<string, string> = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-orange-500',
    exceeded: 'bg-red-500',
};

const healthLabels: Record<string, string> = {
    healthy: 'On Track',
    warning: 'Near Limit',
    danger: 'At Risk',
    exceeded: 'Over Budget',
};

export function BudgetProgress({
    budget,
    showDetails = true,
    compact = false,
    className,
}: BudgetProgressProps) {
    const progressColor = healthColors[budget.budget_health] || 'bg-slate-500';
    const progressWidth = Math.min(budget.spent_percentage, 100);

    if (compact) {
        return (
            <div className={cn('space-y-1', className)}>
                <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate">{budget.name}</span>
                    <span className="text-muted-foreground">
                        {budget.spent_percentage.toFixed(0)}%
                    </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                        className={cn('h-full transition-all duration-300', progressColor)}
                        style={{ width: `${progressWidth}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            {showDetails && (
                <div className="flex items-center justify-between text-sm">
                    <span>
                        {formatCurrency(budget.current_period_spent, budget.currency)} spent
                    </span>
                    <span className="text-muted-foreground">
                        {formatCurrency(budget.effective_budget, budget.currency)} total
                    </span>
                </div>
            )}
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                    className={cn('h-full transition-all duration-500', progressColor)}
                    style={{ width: `${progressWidth}%` }}
                />
            </div>
            {showDetails && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{budget.spent_percentage.toFixed(1)}% used</span>
                    <span className={cn(
                        'font-medium',
                        budget.budget_health === 'exceeded' && 'text-red-500',
                        budget.budget_health === 'danger' && 'text-orange-500',
                        budget.budget_health === 'warning' && 'text-yellow-600',
                        budget.budget_health === 'healthy' && 'text-green-500',
                    )}>
                        {healthLabels[budget.budget_health]}
                    </span>
                </div>
            )}
        </div>
    );
}

interface BudgetProgressCardProps {
    budget: Budget;
    onClick?: () => void;
    className?: string;
}

export function BudgetProgressCard({
    budget,
    onClick,
    className,
}: BudgetProgressCardProps) {
    const progressColor = healthColors[budget.budget_health] || 'bg-slate-500';
    const progressWidth = Math.min(budget.spent_percentage, 100);

    return (
        <div
            className={cn(
                'rounded-lg border p-3 transition-colors',
                onClick && 'cursor-pointer hover:bg-muted/50',
                className,
            )}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {budget.color && (
                        <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: budget.color }}
                        />
                    )}
                    <span className="font-medium truncate">{budget.name}</span>
                </div>
                <span
                    className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded',
                        budget.budget_health === 'exceeded' && 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                        budget.budget_health === 'danger' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
                        budget.budget_health === 'warning' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
                        budget.budget_health === 'healthy' && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
                    )}
                >
                    {budget.spent_percentage.toFixed(0)}%
                </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2">
                <div
                    className={cn('h-full transition-all duration-300', progressColor)}
                    style={{ width: `${progressWidth}%` }}
                />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    {formatCurrency(budget.current_period_spent, budget.currency)} /{' '}
                    {formatCurrency(budget.effective_budget, budget.currency)}
                </span>
                {budget.days_left_in_period !== undefined && (
                    <span>{budget.days_left_in_period}d left</span>
                )}
            </div>
        </div>
    );
}
