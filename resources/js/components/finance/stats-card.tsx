import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    isLoading,
}: StatsCardProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="mt-1 h-3 w-40" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-muted-foreground">
                        {trend && (
                            <span
                                className={
                                    trend.isPositive
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                }
                            >
                                {trend.isPositive ? '+' : ''}
                                {trend.value}
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
