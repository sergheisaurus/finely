import { cn } from '@/lib/utils';
import type { BudgetHealth } from '@/types/finance';
import { AlertCircle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface BudgetHealthBadgeProps {
    health: BudgetHealth;
    showIcon?: boolean;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const healthConfig: Record<
    BudgetHealth,
    {
        label: string;
        icon: typeof CheckCircle;
        className: string;
        dotClassName: string;
    }
> = {
    healthy: {
        label: 'On Track',
        icon: CheckCircle,
        className:
            'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        dotClassName: 'bg-green-500',
    },
    warning: {
        label: 'Near Limit',
        icon: AlertTriangle,
        className:
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
        dotClassName: 'bg-yellow-500',
    },
    danger: {
        label: 'At Risk',
        icon: AlertCircle,
        className:
            'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
        dotClassName: 'bg-orange-500',
    },
    exceeded: {
        label: 'Over Budget',
        icon: XCircle,
        className:
            'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        dotClassName: 'bg-red-500',
    },
};

const sizeConfig = {
    sm: {
        badge: 'px-1.5 py-0.5 text-xs',
        icon: 'h-3 w-3',
        dot: 'h-1.5 w-1.5',
    },
    md: {
        badge: 'px-2 py-1 text-xs',
        icon: 'h-3.5 w-3.5',
        dot: 'h-2 w-2',
    },
    lg: {
        badge: 'px-2.5 py-1 text-sm',
        icon: 'h-4 w-4',
        dot: 'h-2.5 w-2.5',
    },
};

export function BudgetHealthBadge({
    health,
    showIcon = true,
    showLabel = true,
    size = 'md',
    className,
}: BudgetHealthBadgeProps) {
    const config = healthConfig[health];
    const sizes = sizeConfig[size];
    const Icon = config.icon;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full font-medium',
                config.className,
                sizes.badge,
                className,
            )}
        >
            {showIcon && <Icon className={sizes.icon} />}
            {showLabel && config.label}
        </span>
    );
}

interface BudgetHealthDotProps {
    health: BudgetHealth;
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
    className?: string;
}

export function BudgetHealthDot({
    health,
    size = 'md',
    pulse = false,
    className,
}: BudgetHealthDotProps) {
    const config = healthConfig[health];
    const sizes = sizeConfig[size];

    return (
        <span className={cn('relative inline-flex', className)}>
            <span
                className={cn('rounded-full', config.dotClassName, sizes.dot)}
            />
            {pulse && (health === 'exceeded' || health === 'danger') && (
                <span
                    className={cn(
                        'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                        config.dotClassName,
                    )}
                />
            )}
        </span>
    );
}

interface BudgetHealthIndicatorProps {
    health: BudgetHealth;
    percentage: number;
    className?: string;
}

export function BudgetHealthIndicator({
    health,
    percentage,
    className,
}: BudgetHealthIndicatorProps) {
    const config = healthConfig[health];
    const Icon = config.icon;

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div
                className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    config.className,
                )}
            >
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-sm font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% of budget used
                </p>
            </div>
        </div>
    );
}
