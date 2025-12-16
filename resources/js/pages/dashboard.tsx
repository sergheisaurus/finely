import { StatsCard } from '@/components/finance/stats-card';
import { TransactionList } from '@/components/finance/transaction-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/format';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import type { BankAccount, Transaction } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    CreditCard,
    Plus,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchAccounts(), fetchRecentTransactions()]).finally(() =>
            setIsLoading(false),
        );
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/accounts', {
                headers: { Accept: 'application/json' },
            });
            const data = await response.json();
            setAccounts(data.data);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    };

    const fetchRecentTransactions = async () => {
        try {
            const response = await fetch(
                '/api/transactions?per_page=5&sort_by=transaction_date&sort_dir=desc',
                {
                    headers: { Accept: 'application/json' },
                },
            );
            const data = await response.json();
            setTransactions(data.data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const currency = accounts[0]?.currency || 'EUR';

    const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Welcome back! Here's your financial overview
                        </p>
                    </div>
                    <Button onClick={() => router.visit('/journal')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Transaction
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Total Balance"
                        value={formatCurrency(totalBalance, currency)}
                        description="Across all accounts"
                        icon={Wallet}
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Income (Recent)"
                        value={formatCurrency(income, currency)}
                        description="Last 5 transactions"
                        icon={ArrowDownLeft}
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Expenses (Recent)"
                        value={formatCurrency(expenses, currency)}
                        description="Last 5 transactions"
                        icon={ArrowUpRight}
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Net Flow"
                        value={formatCurrency(income - expenses, currency)}
                        description="Income minus expenses"
                        icon={TrendingUp}
                        trend={{
                            value: income > expenses ? '+' : '-',
                            isPositive: income > expenses,
                        }}
                        isLoading={isLoading}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Bank Accounts</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.visit('/accounts')}
                            >
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-16 animate-pulse rounded-lg bg-muted"
                                        />
                                    ))}
                                </div>
                            ) : accounts.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No accounts yet
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() =>
                                            router.visit('/accounts/create')
                                        }
                                    >
                                        Create Account
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {accounts.slice(0, 3).map((account) => (
                                        <div
                                            key={account.id}
                                            className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                            onClick={() =>
                                                router.visit(
                                                    `/accounts/${account.id}`,
                                                )
                                            }
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-10 w-10 rounded-lg"
                                                    style={{
                                                        backgroundColor:
                                                            account.color,
                                                    }}
                                                />
                                                <div>
                                                    <p className="font-medium">
                                                        {account.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {account.bank_name ||
                                                            account.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">
                                                    {formatCurrency(
                                                        account.balance,
                                                        account.currency,
                                                    )}
                                                </p>
                                                {account.is_default && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Default
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Transactions</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.visit('/journal')}
                            >
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <TransactionList
                                transactions={transactions}
                                isLoading={isLoading}
                                onTransactionClick={(transaction) => {
                                    console.log('Transaction:', transaction);
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/journal')}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New Transaction
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/accounts/create')}
                            >
                                <Wallet className="mr-2 h-4 w-4" />
                                Add Account
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/cards')}
                            >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Manage Cards
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
