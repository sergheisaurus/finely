import { StatsCard } from '@/components/finance/stats-card';
import { BarChartCard } from '@/components/statistics/charts/bar-chart-card';
import { PieChartCard } from '@/components/statistics/charts/pie-chart-card';
import type { StatisticsFilters } from '@/hooks/use-statistics-filters';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type {
    CashFlowItem,
    FinancialSnapshot,
    TopCategory,
    TopMerchant,
    Trend,
} from '@/types/statistics';
import { DollarSign, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OverviewTabProps {
    filters: StatisticsFilters;
    apiFilters: Record<string, unknown>;
}

export function OverviewTab({ apiFilters }: OverviewTabProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
    const [cashFlow, setCashFlow] = useState<CashFlowItem[]>([]);
    const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
    const [topMerchants, setTopMerchants] = useState<TopMerchant[]>([]);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [snapshotRes, cashFlowRes, categoriesRes, merchantsRes] =
                    await Promise.all([
                        api.get('/statistics/snapshot', { params: apiFilters }),
                        api.get('/statistics/cash-flow', {
                            params: apiFilters,
                        }),
                        api.get('/statistics/top-categories', {
                            params: { ...apiFilters, limit: 10 },
                        }),
                        api.get('/statistics/top-merchants', {
                            params: { ...apiFilters, limit: 10 },
                        }),
                    ]);

                if (!cancelled) {
                    setSnapshot(snapshotRes.data);
                    setCashFlow(cashFlowRes.data);
                    setTopCategories(categoriesRes.data);
                    setTopMerchants(merchantsRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch overview data:', error);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [apiFilters]);

    const formatTrend = (trend: Trend | undefined) => {
        if (!trend) return undefined;
        return {
            value: `${Math.abs(trend.percentage).toFixed(1)}%`,
            isPositive: trend.direction === 'up',
        };
    };

    return (
        <div className="space-y-6">
            {/* Financial Snapshot Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Balance"
                    value={
                        snapshot
                            ? formatCurrency(snapshot.total_balance, 'CHF')
                            : 'CHF 0'
                    }
                    description="Current net worth"
                    icon={DollarSign}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Income"
                    value={
                        snapshot
                            ? formatCurrency(snapshot.total_income, 'CHF')
                            : 'CHF 0'
                    }
                    description="For selected period"
                    icon={TrendingUp}
                    trend={
                        snapshot
                            ? formatTrend(snapshot.income_trend)
                            : undefined
                    }
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Expenses"
                    value={
                        snapshot
                            ? formatCurrency(snapshot.total_expenses, 'CHF')
                            : 'CHF 0'
                    }
                    description="For selected period"
                    icon={TrendingDown}
                    trend={
                        snapshot
                            ? formatTrend(snapshot.expenses_trend)
                            : undefined
                    }
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Net Savings"
                    value={
                        snapshot
                            ? formatCurrency(snapshot.net_savings, 'CHF')
                            : 'CHF 0'
                    }
                    description={
                        snapshot
                            ? `Savings rate: ${snapshot.savings_rate.toFixed(1)}%`
                            : 'No data'
                    }
                    icon={PiggyBank}
                    isLoading={isLoading}
                />
            </div>

            {/* Cash Flow Chart */}
            <BarChartCard
                title="Cash Flow Analysis"
                description="Income vs Expenses over time"
                data={cashFlow}
                dataKeys={[
                    { key: 'income', name: 'Income', color: '#10b981' },
                    { key: 'expenses', name: 'Expenses', color: '#ef4444' },
                ]}
                xAxisKey="period"
                isLoading={isLoading}
                valueFormatter={(value) => formatCurrency(value, 'CHF')}
            />

            {/* Top Categories and Merchants */}
            <div className="grid gap-6 md:grid-cols-2">
                <PieChartCard
                    title="Top Spending Categories"
                    description="Your biggest expense categories"
                    data={topCategories}
                    dataKey="total"
                    nameKey="name"
                    isLoading={isLoading}
                    valueFormatter={(value) => formatCurrency(value, 'CHF')}
                />

                <BarChartCard
                    title="Top Merchants"
                    description="Where you spend the most"
                    data={topMerchants.slice(0, 10)}
                    dataKeys={[
                        { key: 'total', name: 'Total Spent', color: '#3b82f6' },
                    ]}
                    xAxisKey="name"
                    isLoading={isLoading}
                    valueFormatter={(value) => formatCurrency(value, 'CHF')}
                    height={300}
                />
            </div>
        </div>
    );
}
