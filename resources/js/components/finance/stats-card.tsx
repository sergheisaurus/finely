import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string;
    description?: string;
    icon?: LucideIcon;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    isLoading?: boolean;
    className?: string;
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    isLoading,
    className,
}: StatsCardProps) {
    if (isLoading) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="mt-2 h-3 w-40" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('overflow-hidden transition-all duration-200', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight">
                    {value}
                </div>
                {(description || trend) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {trend && (
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium',
                                    trend.isPositive
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                                )}
                            >
                                {trend.isPositive ? '↑' : '↓'} {trend.value}
                            </span>
                        )}
                        {trend && description && ' '}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
