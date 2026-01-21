import { StatsCard } from '@/components/finance/stats-card';
import { BarChartCard } from '@/components/statistics/charts/bar-chart-card';
import { PieChartCard } from '@/components/statistics/charts/pie-chart-card';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Subscription, SubscriptionStats } from '@/types/finance';
import { CalendarClock, DollarSign, Hash } from 'lucide-react';
import { useEffect, useState } from 'react';

export function SubscriptionsTab() {
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [stats, setStats] = useState<SubscriptionStats | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [subsRes, statsRes] = await Promise.all([
                    api.get('/subscriptions', { params: { per_page: 50 } }),
                    api.get('/subscriptions/stats'),
                ]);

                if (!cancelled) {
                    setSubscriptions(subsRes.data.data || []);
                    setStats(statsRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch subscriptions:', error);
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
    }, []);

    const subscriptionsForChart = subscriptions.map((sub) => ({
        name: sub.name,
        amount: sub.monthly_equivalent || sub.amount,
    }));

    return (
        <div className="space-y-6">
            {/* Subscription Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Active Subscriptions"
                    value={stats?.active_count?.toString() || '0'}
                    description="Currently active"
                    icon={Hash}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Monthly Cost"
                    value={formatCurrency(stats?.monthly_total || 0, 'CHF')}
                    description="Recurring every month"
                    icon={DollarSign}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Annual Cost"
                    value={formatCurrency(stats?.yearly_total || 0, 'CHF')}
                    description="Total per year"
                    icon={CalendarClock}
                    isLoading={isLoading}
                />
            </div>

            {/* Subscription Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <PieChartCard
                    title="Subscription Breakdown"
                    description="Monthly cost per subscription"
                    data={subscriptionsForChart.slice(0, 10)}
                    dataKey="amount"
                    nameKey="name"
                    isLoading={isLoading}
                    valueFormatter={(value) =>
                        formatCurrency(Number(value || 0), 'CHF')
                    }
                    height={350}
                />

                <BarChartCard
                    title="Top Subscriptions"
                    description="Your most expensive subscriptions"
                    data={subscriptionsForChart.slice(0, 10)}
                    dataKeys={[
                        {
                            key: 'amount',
                            name: 'Monthly Cost',
                            color: '#8b5cf6',
                        },
                    ]}
                    xAxisKey="name"
                    isLoading={isLoading}
                    valueFormatter={(value) =>
                        formatCurrency(Number(value || 0), 'CHF')
                    }
                    height={350}
                />
            </div>
        </div>
    );
}
