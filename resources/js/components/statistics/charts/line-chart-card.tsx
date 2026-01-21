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
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

// Beautiful color palette
const CHART_COLORS = {
    primary: '#10b981', // emerald-500
    secondary: '#f59e0b', // amber-500
    tertiary: '#3b82f6', // blue-500
    quaternary: '#8b5cf6', // violet-500
    danger: '#ef4444', // red-500
    success: '#22c55e', // green-500
};

interface LineChartCardProps {
    title: string;
    description?: string;
    data: Record<string, unknown>[];
    dataKeys: {
        key: string;
        name: string;
        color?: string;
    }[];
    xAxisKey: string;
    isLoading?: boolean;
    className?: string;
    height?: number;
    valueFormatter?: (value: number | string | undefined) => string;
}

export function LineChartCard({
    title,
    description,
    data,
    dataKeys,
    xAxisKey,
    isLoading,
    className,
    height = 350,
    valueFormatter = (value) =>
        typeof value === 'number'
            ? value.toLocaleString()
            : String(value || ''),
}: LineChartCardProps) {
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

    const colors = [
        CHART_COLORS.primary,
        CHART_COLORS.tertiary,
        CHART_COLORS.secondary,
        CHART_COLORS.quaternary,
    ];

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
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                            opacity={0.3}
                        />
                        <XAxis
                            dataKey={xAxisKey}
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--border))"
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={valueFormatter}
                            stroke="hsl(var(--border))"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                            labelStyle={{
                                color: 'hsl(var(--popover-foreground))',
                            }}
                            formatter={valueFormatter}
                        />
                        <Legend
                            wrapperStyle={{
                                paddingTop: '20px',
                            }}
                        />
                        {dataKeys.map((dataKey, index) => (
                            <Line
                                key={dataKey.key}
                                type="monotone"
                                dataKey={dataKey.key}
                                name={dataKey.name}
                                stroke={
                                    dataKey.color ||
                                    colors[index % colors.length]
                                }
                                strokeWidth={2}
                                dot={{
                                    fill:
                                        dataKey.color ||
                                        colors[index % colors.length],
                                    r: 4,
                                }}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
