import { StatsCard } from '@/components/finance/stats-card';
import { BarChartCard } from '@/components/statistics/charts/bar-chart-card';
import type { StatisticsFilters } from '@/hooks/use-statistics-filters';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { CashFlowItem, FinancialSnapshot } from '@/types/statistics';
import { DollarSign, Percent, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface IncomeTabProps {
    filters: StatisticsFilters;
    apiFilters: Record<string, unknown>;
}

export function IncomeTab({ apiFilters }: IncomeTabProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
    const [cashFlow, setCashFlow] = useState<CashFlowItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [snapshotRes, cashFlowRes] = await Promise.all([
                    api.get('/statistics/snapshot', { params: apiFilters }),
                    api.get('/statistics/cash-flow', { params: apiFilters }),
                ]);

                if (!cancelled) {
                    setSnapshot(snapshotRes.data);
                    setCashFlow(cashFlowRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch income data:', error);
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

    return (
        <div className="space-y-6">
            {/* Income Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Total Income"
                    value={
                        snapshot
                            ? formatCurrency(snapshot.total_income, 'CHF')
                            : 'CHF 0'
                    }
                    description="For selected period"
                    icon={TrendingUp}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Net Savings"
                    value={
                        snapshot
                            ? formatCurrency(snapshot.net_savings, 'CHF')
                            : 'CHF 0'
                    }
                    description="Income minus expenses"
                    icon={DollarSign}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Savings Rate"
                    value={
                        snapshot ? `${snapshot.savings_rate.toFixed(1)}%` : '0%'
                    }
                    description="Percentage saved"
                    icon={Percent}
                    isLoading={isLoading}
                />
            </div>

            {/* Income Trend */}
            <BarChartCard
                title="Income vs Expenses"
                description="Track your earnings and spending"
                data={cashFlow}
                dataKeys={[
                    { key: 'income', name: 'Income', color: '#10b981' },
                    { key: 'expenses', name: 'Expenses', color: '#ef4444' },
                ]}
                xAxisKey="period"
                isLoading={isLoading}
                valueFormatter={(value) => formatCurrency(value, 'CHF')}
            />
        </div>
    );
}
