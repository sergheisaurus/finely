import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

// Beautiful color palette
const CHART_COLORS = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#ef4444', // red-500
    '#22c55e', // green-500
];

interface PieChartCardProps {
    title: string;
    description?: string;
    data: Record<string, unknown>[];
    dataKey: string;
    nameKey: string;
    isLoading?: boolean;
    className?: string;
    height?: number;
    valueFormatter?: (value: number | string | undefined) => string;
    showLegend?: boolean;
}

export function PieChartCard({
    title,
    description,
    data,
    dataKey,
    nameKey,
    isLoading,
    className,
    height = 350,
    valueFormatter = (value) =>
        typeof value === 'number'
            ? value.toLocaleString()
            : String(value || ''),
    showLegend = true,
}: PieChartCardProps) {
    if (isLoading) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardHeader>
                    <Skeleton className="h-5 w-48" />
                    {description && <Skeleton className="mt-2 h-4 w-64" />}
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[350px] w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="flex h-[350px] items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        No data available
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                                `${name} ${((percent || 0) * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey={dataKey}
                            nameKey={nameKey}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        CHART_COLORS[
                                            index % CHART_COLORS.length
                                        ]
                                    }
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                            formatter={valueFormatter}
                        />
                        {showLegend && <Legend />}
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
