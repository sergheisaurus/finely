import { BudgetAlert } from '@/components/finance/budget-alert';
import { BudgetProgressCard } from '@/components/finance/budget-progress';
import { StatsCard } from '@/components/finance/stats-card';
import { TransactionList } from '@/components/finance/transaction-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import type { BankAccount, Budget, RecurringIncome, Subscription, Transaction } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    CalendarClock,
    CreditCard,
    PiggyBank,
    Plus,
    Sparkles,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<Subscription[]>([]);
    const [upcomingIncome, setUpcomingIncome] = useState<RecurringIncome[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [budgetsAtRisk, setBudgetsAtRisk] = useState<Budget[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAccounts = useCallback(async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    }, []);

    const fetchRecentTransactions = useCallback(async () => {
        try {
            const response = await api.get(
                '/transactions?per_page=5&sort_by=transaction_date&sort_dir=desc',
            );
            setTransactions(response.data.data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    }, []);

    const fetchUpcomingSubscriptions = useCallback(async () => {
        try {
            const response = await api.get('/subscriptions/upcoming?days=14');
            setUpcomingSubscriptions(response.data.data);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        }
    }, []);

    const fetchUpcomingIncome = useCallback(async () => {
        try {
            const response = await api.get('/recurring-incomes/upcoming?days=14');
            setUpcomingIncome(response.data.data);
        } catch (error) {
            console.error('Failed to fetch income:', error);
        }
    }, []);

    const fetchBudgets = useCallback(async () => {
        try {
            const response = await api.get('/budgets?is_active=1&per_page=5');
            setBudgets(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch budgets:', error);
        }
    }, []);

    const fetchBudgetsAtRisk = useCallback(async () => {
        try {
            const response = await api.get('/budgets/health');
            setBudgetsAtRisk(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch budgets at risk:', error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                fetchAccounts(),
                fetchRecentTransactions(),
                fetchUpcomingSubscriptions(),
                fetchUpcomingIncome(),
                fetchBudgets(),
                fetchBudgetsAtRisk(),
            ]);
            setIsLoading(false);
        };
        loadData();
    }, [fetchAccounts, fetchRecentTransactions, fetchUpcomingSubscriptions, fetchUpcomingIncome, fetchBudgets, fetchBudgetsAtRisk]);

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const currency = accounts[0]?.currency || 'CHF';

    const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
                    <div>
                        <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                            Welcome back
                        </h1>
                        <p className="text-muted-foreground">
                            Here's your financial overview
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/journal/create')}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Transaction
                    </Button>
                </div>

                {/* Budget Alerts */}
                {budgetsAtRisk.length > 0 && (
                    <BudgetAlert budgets={budgetsAtRisk} className="animate-fade-in-up" />
                )}

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="animate-fade-in-up stagger-1 opacity-0">
                        <StatsCard
                            title="Total Balance"
                            value={formatCurrency(totalBalance, currency)}
                            description="Across all accounts"
                            icon={Wallet}
                            isLoading={isLoading}
                            className="hover-lift card-glow"
                        />
                    </div>
                    <div className="animate-fade-in-up stagger-2 opacity-0">
                        <StatsCard
                            title="Income (Recent)"
                            value={formatCurrency(income, currency)}
                            description="Last 5 transactions"
                            icon={ArrowDownLeft}
                            isLoading={isLoading}
                            className="hover-lift"
                        />
                    </div>
                    <div className="animate-fade-in-up stagger-3 opacity-0">
                        <StatsCard
                            title="Expenses (Recent)"
                            value={formatCurrency(expenses, currency)}
                            description="Last 5 transactions"
                            icon={ArrowUpRight}
                            isLoading={isLoading}
                            className="hover-lift"
                        />
                    </div>
                    <div className="animate-fade-in-up stagger-4 opacity-0">
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
                            className="hover-lift"
                        />
                    </div>
                </div>

                {/* Upcoming Payments */}
                {(upcomingSubscriptions.length > 0 || upcomingIncome.length > 0) && (
                    <div className="grid gap-6 lg:grid-cols-2 animate-fade-in-up stagger-5 opacity-0">
                        {/* Upcoming Subscriptions */}
                        <Card className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                                        <CalendarClock className="h-4 w-4 text-red-500" />
                                    </div>
                                    <CardTitle className="text-lg">Upcoming Subscriptions</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.visit('/subscriptions')}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    View All
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4">
                                {upcomingSubscriptions.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">
                                        No upcoming subscriptions
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {upcomingSubscriptions.slice(0, 4).map((sub) => (
                                            <div
                                                key={sub.id}
                                                className="group flex cursor-pointer items-center justify-between rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-border hover:bg-muted/50"
                                                onClick={() => router.visit(`/subscriptions/${sub.id}`)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                                                        style={{ backgroundColor: sub.color || '#ef4444' }}
                                                    >
                                                        <DynamicIcon
                                                            name={sub.icon}
                                                            fallback={CreditCard}
                                                            className="h-5 w-5 text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{sub.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {sub.next_billing_date
                                                                ? new Date(sub.next_billing_date).toLocaleDateString()
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-semibold text-red-600 tabular-nums">
                                                    -{formatCurrency(sub.amount, sub.currency)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming Income */}
                        <Card className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </div>
                                    <CardTitle className="text-lg">Expected Income</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.visit('/income')}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    View All
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4">
                                {upcomingIncome.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">
                                        No expected income
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {upcomingIncome.slice(0, 4).map((inc) => (
                                            <div
                                                key={inc.id}
                                                className="group flex cursor-pointer items-center justify-between rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-border hover:bg-muted/50"
                                                onClick={() => router.visit(`/income/${inc.id}`)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                                                        style={{ backgroundColor: inc.color || '#10b981' }}
                                                    >
                                                        <DynamicIcon
                                                            name={inc.icon}
                                                            fallback={TrendingUp}
                                                            className="h-5 w-5 text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{inc.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {inc.next_expected_date
                                                                ? new Date(inc.next_expected_date).toLocaleDateString()
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-semibold text-green-600 tabular-nums">
                                                    +{formatCurrency(inc.amount, inc.currency)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Budget Overview */}
                {budgets.length > 0 && (
                    <Card className="animate-fade-in-up stagger-5 opacity-0 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                                    <PiggyBank className="h-4 w-4 text-indigo-500" />
                                </div>
                                <CardTitle className="text-lg">Budget Overview</CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.visit('/budgets')}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                View All
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {budgets.slice(0, 6).map((budget) => (
                                    <BudgetProgressCard
                                        key={budget.id}
                                        budget={budget}
                                        onClick={() => router.visit(`/budgets/${budget.id}`)}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Bank Accounts */}
                    <Card className="animate-fade-in-up stagger-6 opacity-0 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                                    <Wallet className="h-4 w-4 text-blue-500" />
                                </div>
                                <CardTitle className="text-lg">Bank Accounts</CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.visit('/accounts')}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                View All
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-16 animate-pulse rounded-xl bg-muted"
                                        />
                                    ))}
                                </div>
                            ) : accounts.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                        <Wallet className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        No accounts yet
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() =>
                                            router.visit('/accounts/create')
                                        }
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Account
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {accounts.slice(0, 4).map((account, index) => (
                                        <div
                                            key={account.id}
                                            className="group flex cursor-pointer items-center justify-between rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-border hover:bg-muted/50 hover:shadow-sm"
                                            onClick={() =>
                                                router.visit(
                                                    `/accounts/${account.id}`,
                                                )
                                            }
                                            style={{
                                                animationDelay: `${index * 0.1}s`,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                                                    style={{
                                                        backgroundColor: account.color,
                                                    }}
                                                >
                                                    <Wallet className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {account.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {account.bank_name || account.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold tabular-nums">
                                                    {formatCurrency(
                                                        account.balance,
                                                        account.currency,
                                                    )}
                                                </p>
                                                {account.is_default && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                        <Sparkles className="h-3 w-3" />
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card className="animate-fade-in-up stagger-7 opacity-0 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                </div>
                                <CardTitle className="text-lg">Recent Transactions</CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.visit('/journal')}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                View All
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4">
                            <TransactionList
                                transactions={transactions}
                                isLoading={isLoading}
                                onTransactionClick={(transaction) =>
                                    router.visit(`/journal/${transaction.id}/edit`)
                                }
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.8s' }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/journal/create')}
                                className="hover-lift transition-all"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New Transaction
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/accounts/create')}
                                className="hover-lift transition-all"
                            >
                                <Wallet className="mr-2 h-4 w-4" />
                                Add Account
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/cards/create')}
                                className="hover-lift transition-all"
                            >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Add Card
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
