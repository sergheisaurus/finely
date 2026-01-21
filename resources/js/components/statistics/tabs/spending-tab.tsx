import { StatsCard } from '@/components/finance/stats-card';
import { PieChartCard } from '@/components/statistics/charts/pie-chart-card';
import type { StatisticsFilters } from '@/hooks/use-statistics-filters';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { FinancialSnapshot, TopCategory } from '@/types/statistics';
import { CreditCard, ShoppingCart, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SpendingTabProps {
    filters: StatisticsFilters;
    apiFilters: Record<string, unknown>;
}

export function SpendingTab({ apiFilters }: SpendingTabProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
    const [categories, setCategories] = useState<TopCategory[]>([]);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [snapshotRes, categoriesRes] = await Promise.all([
                    api.get('/statistics/snapshot', { params: apiFilters }),
                    api.get('/statistics/top-categories', {
                        params: { ...apiFilters, limit: 10 },
                    }),
                ]);

                if (!cancelled) {
                    setSnapshot(snapshotRes.data);
                    setCategories(categoriesRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch spending data:', error);
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
            {/* Spending Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Total Expenses"
                    value={
                        snapshot
                            ? formatCurrency(snapshot.total_expenses, 'CHF')
                            : 'CHF 0'
                    }
                    description="For selected period"
                    icon={TrendingDown}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Average Transaction"
                    value={
                        snapshot && categories.length > 0
                            ? formatCurrency(
                                  snapshot.total_expenses /
                                      categories.reduce(
                                          (sum, cat) =>
                                              sum + cat.transaction_count,
                                          0,
                                      ),
                                  'CHF',
                              )
                            : 'CHF 0'
                    }
                    description="Per transaction"
                    icon={ShoppingCart}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Categories"
                    value={categories.length.toString()}
                    description="Active spending categories"
                    icon={CreditCard}
                    isLoading={isLoading}
                />
            </div>

            {/* Spending by Category */}
            <PieChartCard
                title="Spending by Category"
                description="Where your money goes"
                data={categories}
                dataKey="total"
                nameKey="name"
                isLoading={isLoading}
                valueFormatter={(value) =>
                    formatCurrency(Number(value || 0), 'CHF')
                }
                height={400}
            />
        </div>
    );
}
