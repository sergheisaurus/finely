import { StatsCard } from '@/components/finance/stats-card';
import { PieChartCard } from '@/components/statistics/charts/pie-chart-card';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { BankAccount } from '@/types/finance';
import { DollarSign, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AccountsTab() {
    const [isLoading, setIsLoading] = useState(true);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/accounts');

                if (!cancelled) {
                    const accountsData = response.data.data || [];
                    setAccounts(accountsData);
                    setTotalBalance(
                        accountsData.reduce(
                            (sum: number, acc: BankAccount) =>
                                sum + acc.balance,
                            0,
                        ),
                    );
                }
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
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

    const accountsForChart = accounts.map((acc) => ({
        name: acc.name,
        balance: acc.balance,
    }));

    return (
        <div className="space-y-6">
            {/* Account Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <StatsCard
                    title="Total Balance"
                    value={formatCurrency(totalBalance, 'CHF')}
                    description="Across all accounts"
                    icon={DollarSign}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Accounts"
                    value={accounts.length.toString()}
                    description="Active bank accounts"
                    icon={Wallet}
                    isLoading={isLoading}
                />
            </div>

            {/* Account Balance Distribution */}
            <PieChartCard
                title="Balance Distribution"
                description="How your money is distributed across accounts"
                data={accountsForChart}
                dataKey="balance"
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
