import { TransactionFormModal } from '@/components/finance/transaction-form-modal';
import { TransactionList } from '@/components/finance/transaction-list';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { dashboard } from '@/routes/pages';
import { useSecretStore } from '@/stores/useSecretStore';
import { type BreadcrumbItem } from '@/types';
import type {
    BankAccount,
    Budget,
    RecurringIncome,
    Subscription,
    Transaction,
} from '@/types/finance';
import { Menu } from '@base-ui/react/menu';
import { Progress } from '@base-ui/react/progress';
import { Tabs } from '@base-ui/react/tabs';
import { Tooltip } from '@base-ui/react/tooltip';
import { Head, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    CalendarClock,
    CreditCard,
    Info,
    PiggyBank,
    Plus,
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

// --- Custom Base UI Elements ---

type GlassCardProps = {
    children: React.ReactNode;
    className?: string;
};

const GlassCard = ({ children, className = '' }: GlassCardProps) => (
    <div
        className={`overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm ${className}`}
    >
        {children}
    </div>
);

type StatsCardBaseProps = {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    colorClass: string;
    tooltipContent: string;
};

const StatsCardBase = ({
    title,
    value,
    description,
    icon: Icon,
    colorClass,
    tooltipContent,
}: StatsCardBaseProps) => (
    <Tooltip.Root>
        <Tooltip.Trigger className="group relative w-full cursor-default overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left shadow-sm transition-colors duration-200 outline-none hover:bg-slate-800/80">
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400 transition-colors group-hover:text-slate-300">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
                        {value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                        {description}
                    </p>
                </div>
                <div
                    className={`rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 ${colorClass}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
            <Tooltip.Positioner
                side="top"
                sideOffset={8}
                className="z-50 animate-in duration-200 outline-none zoom-in-95 fade-in"
            >
                <Tooltip.Popup className="max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-center text-sm text-slate-200 shadow-xl backdrop-blur-md">
                    {tooltipContent}
                    <Tooltip.Arrow className="fill-slate-700" />
                </Tooltip.Popup>
            </Tooltip.Positioner>
        </Tooltip.Portal>
    </Tooltip.Root>
);

export default function Dashboard() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<
        Subscription[]
    >([]);
    const [upcomingIncome, setUpcomingIncome] = useState<RecurringIncome[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isSecretModeActive } = useSecretStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editTransaction, setEditTransaction] = useState<Transaction | null>(
        null,
    );

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
            const response = await api.get(
                '/recurring-incomes/upcoming?days=14',
            );
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

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                fetchAccounts(),
                fetchRecentTransactions(),
                fetchUpcomingSubscriptions(),
                fetchUpcomingIncome(),
                fetchBudgets(),
            ]);
            setIsLoading(false);
        };
        loadData();
    }, [
        fetchAccounts,
        fetchRecentTransactions,
        fetchUpcomingSubscriptions,
        fetchUpcomingIncome,
        fetchBudgets,
    ]);

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const currency = accounts[0]?.currency || 'CHF';

    const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const netFlow = income - expenses;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="relative min-h-screen bg-[#07090e] font-sans text-slate-200">
                <div className="animate-fade-in-up relative z-10 space-y-8 px-4 pt-8">
                    {/* Header */}
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                {isSecretModeActive ? (
                                    <span className="text-fuchsia-400">
                                        Welcome back, slut 💕
                                    </span>
                                ) : (
                                    'Overview'
                                )}
                            </h1>
                            <p className="mt-1 text-sm font-medium text-slate-400 sm:text-base">
                                {isSecretModeActive
                                    ? 'Here’s your filthy spending overview 🔒'
                                    : 'Your financial life at a glance, beautifully organized.'}
                            </p>
                        </div>

                        {/* Top Right Actions using Base UI Menu */}
                        <Menu.Root>
                            <Menu.Trigger className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors outline-none hover:bg-slate-800">
                                <Plus className="h-4 w-4" />
                                Add New
                            </Menu.Trigger>
                            <Menu.Portal>
                                <Menu.Positioner
                                    align="end"
                                    sideOffset={8}
                                    className="z-50 animate-in duration-200 outline-none slide-in-from-top-2"
                                >
                                    <Menu.Popup className="min-w-[220px] space-y-1 rounded-2xl border border-slate-700 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-2xl outline-none">
                                        <Menu.Item
                                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors outline-none hover:bg-white/10 hover:text-white"
                                            onClick={() =>
                                                setShowCreateModal(true)
                                            }
                                        >
                                            <div className="rounded-md bg-emerald-500/20 p-1.5 text-emerald-400">
                                                <TrendingUp className="h-4 w-4" />
                                            </div>
                                            Transaction
                                        </Menu.Item>
                                        <Menu.Item
                                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors outline-none hover:bg-white/10 hover:text-white"
                                            onClick={() =>
                                                router.visit('/accounts/create')
                                            }
                                        >
                                            <div className="rounded-md bg-blue-500/20 p-1.5 text-blue-400">
                                                <Wallet className="h-4 w-4" />
                                            </div>
                                            Bank Account
                                        </Menu.Item>
                                        <Menu.Item
                                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors outline-none hover:bg-white/10 hover:text-white"
                                            onClick={() =>
                                                router.visit('/budgets')
                                            }
                                        >
                                            <div className="rounded-md bg-fuchsia-500/20 p-1.5 text-fuchsia-400">
                                                <PiggyBank className="h-4 w-4" />
                                            </div>
                                            Budget Target
                                        </Menu.Item>
                                    </Menu.Popup>
                                </Menu.Positioner>
                            </Menu.Portal>
                        </Menu.Root>
                    </div>

                    {/* Stats Grid */}
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                        <StatsCardBase
                            title="Total Balance"
                            value={
                                isLoading
                                    ? '...'
                                    : formatCurrency(totalBalance, currency)
                            }
                            description="Across all accounts"
                            icon={Wallet}
                            colorClass="text-blue-400"
                            tooltipContent="The sum of all your positive and negative balances."
                        />
                        <StatsCardBase
                            title="Recent Income"
                            value={
                                isLoading
                                    ? '...'
                                    : formatCurrency(income, currency)
                            }
                            description="Last 5 transactions"
                            icon={ArrowDownLeft}
                            colorClass="text-emerald-400"
                            tooltipContent="Cash flowing into your accounts recently."
                        />
                        <StatsCardBase
                            title="Recent Expenses"
                            value={
                                isLoading
                                    ? '...'
                                    : formatCurrency(expenses, currency)
                            }
                            description="Last 5 transactions"
                            icon={ArrowUpRight}
                            colorClass="text-fuchsia-400"
                            tooltipContent="Cash leaving your accounts recently."
                        />
                        <StatsCardBase
                            title="Recent Net Flow"
                            value={
                                isLoading
                                    ? '...'
                                    : `${netFlow > 0 ? '+' : ''}${formatCurrency(netFlow, currency)}`
                            }
                            description="Income vs Expenses"
                            icon={TrendingUp}
                            colorClass={
                                netFlow >= 0 ? 'text-teal-400' : 'text-rose-400'
                            }
                            tooltipContent="Your net gain or deficit over the recent period."
                        />
                    </div>

                    {/* Main Content Tabs */}
                    <Tabs.Root defaultValue="overview" className="mt-8">
                        <Tabs.List className="mx-auto flex w-fit gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-1 shadow-sm sm:mx-0">
                            <Tabs.Tab
                                value="overview"
                                className="rounded-lg px-4 py-1.5 text-sm font-semibold text-slate-400 transition-all outline-none hover:text-slate-300 data-[active]:bg-slate-800 data-[active]:text-white"
                            >
                                General Flow
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="planning"
                                className="rounded-lg px-4 py-1.5 text-sm font-semibold text-slate-400 transition-all outline-none hover:text-slate-300 data-[active]:bg-slate-800 data-[active]:text-white"
                            >
                                Planning & Budgets
                            </Tabs.Tab>
                        </Tabs.List>

                        {/* GENERAL FLOW TAB */}
                        <Tabs.Panel
                            value="overview"
                            className="mt-6 grid animate-in grid-cols-1 gap-6 duration-500 slide-in-from-bottom-4 lg:grid-cols-3"
                        >
                            {/* Left Column (Transactions) */}
                            <div className="space-y-6 lg:col-span-2">
                                <GlassCard>
                                    <div className="flex items-center justify-between border-b border-white/10 p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-emerald-500/10 p-2">
                                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <h2 className="text-lg font-bold text-white">
                                                Recent Transactions
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() =>
                                                router.visit('/journal')
                                            }
                                            className="flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                                        >
                                            View Journal{' '}
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="p-2 sm:p-5">
                                        <TransactionList
                                            transactions={transactions}
                                            isLoading={isLoading}
                                            onTransactionClick={(transaction) =>
                                                setEditTransaction(transaction)
                                            }
                                        />
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Right Column (Accounts) */}
                            <div className="space-y-6">
                                <GlassCard>
                                    <div className="flex items-center justify-between border-b border-white/10 p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-blue-500/10 p-2">
                                                <Wallet className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <h2 className="text-lg font-bold text-white">
                                                Your Wallets
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() =>
                                                router.visit('/accounts')
                                            }
                                            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
                                        >
                                            All
                                        </button>
                                    </div>
                                    <div className="space-y-3 p-3 sm:p-5">
                                        {accounts.length === 0 && !isLoading ? (
                                            <div className="py-8 text-center text-slate-500">
                                                <Wallet className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                                <p className="text-sm">
                                                    No accounts configured.
                                                </p>
                                            </div>
                                        ) : (
                                            accounts.slice(0, 5).map((acc) => (
                                                <div
                                                    key={acc.id}
                                                    onClick={() =>
                                                        router.visit(
                                                            `/accounts/${acc.id}`,
                                                        )
                                                    }
                                                    className="group flex cursor-pointer items-center justify-between rounded-xl border border-transparent bg-white/5 p-3 transition-all hover:border-white/10 hover:bg-white/10"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 shadow-inner"
                                                            style={{
                                                                backgroundColor: `${acc.color}40`,
                                                            }}
                                                        >
                                                            <Wallet
                                                                className="h-4 w-4"
                                                                style={{
                                                                    color: acc.color,
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-200 transition-colors group-hover:text-white">
                                                                {acc.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {acc.type}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold tracking-tight">
                                                            {formatCurrency(
                                                                acc.balance,
                                                                acc.currency,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </GlassCard>
                            </div>
                        </Tabs.Panel>

                        {/* PLANNING & BUDGETS TAB */}
                        <Tabs.Panel
                            value="planning"
                            className="mt-6 grid animate-in grid-cols-1 gap-6 duration-500 slide-in-from-bottom-4 lg:grid-cols-2"
                        >
                            <GlassCard className="col-span-1 lg:col-span-2">
                                <div className="flex items-center gap-3 border-b border-white/10 p-5">
                                    <div className="rounded-lg bg-fuchsia-500/10 p-2">
                                        <PiggyBank className="h-5 w-5 text-fuchsia-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">
                                        Active Budget Targets
                                    </h2>
                                    <Tooltip.Root>
                                        <Tooltip.Trigger className="ml-2 outline-none">
                                            <Info className="h-4 w-4 text-slate-500 transition-colors hover:text-slate-300" />
                                        </Tooltip.Trigger>
                                        <Tooltip.Portal>
                                            <Tooltip.Positioner
                                                side="top"
                                                sideOffset={8}
                                                className="z-50"
                                            >
                                                <Tooltip.Popup className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white">
                                                    Track your spending limits
                                                    securely mapped from your
                                                    historical data.
                                                </Tooltip.Popup>
                                            </Tooltip.Positioner>
                                        </Tooltip.Portal>
                                    </Tooltip.Root>
                                </div>
                                <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {budgets.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No active budgets.
                                        </p>
                                    ) : (
                                        budgets.map((budget) => {
                                            const percent = Math.min(
                                                (budget.current_period_spent /
                                                    budget.amount) *
                                                    100,
                                                100,
                                            );
                                            const isAtRisk = percent > 80;
                                            return (
                                                <div
                                                    key={budget.id}
                                                    onClick={() =>
                                                        router.visit(
                                                            `/budgets/${budget.id}`,
                                                        )
                                                    }
                                                    className="group cursor-pointer rounded-2xl border border-white/5 bg-slate-900/50 p-4 transition-all hover:bg-slate-800/80"
                                                >
                                                    <div className="mb-3 flex justify-between">
                                                        <p className="text-sm font-semibold text-slate-300 group-hover:text-white">
                                                            {budget.name}
                                                        </p>
                                                        <p className="rounded-md bg-white/10 px-2 py-1 font-mono text-xs">
                                                            {formatCurrency(
                                                                budget.current_period_spent,
                                                                budget.currency,
                                                            )}{' '}
                                                            /{' '}
                                                            {formatCurrency(
                                                                budget.amount,
                                                                budget.currency,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <Progress.Root
                                                        value={percent}
                                                        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
                                                    >
                                                        <Progress.Indicator
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isAtRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                            style={{
                                                                transform: `translateX(-${100 - percent}%)`,
                                                            }}
                                                        />
                                                    </Progress.Root>
                                                    <div className="mt-2 flex justify-between text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                        <span>
                                                            Spent:{' '}
                                                            {percent.toFixed(0)}
                                                            %
                                                        </span>
                                                        <span>
                                                            {budget.period}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </GlassCard>

                            <GlassCard>
                                <div className="flex items-center justify-between border-b border-white/10 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-rose-500/10 p-2">
                                            <CalendarClock className="h-5 w-5 text-rose-400" />
                                        </div>
                                        <h2 className="text-lg font-bold text-white">
                                            Upcoming Subscriptions
                                        </h2>
                                    </div>
                                </div>
                                <div className="space-y-4 p-5">
                                    {upcomingSubscriptions.length === 0 ? (
                                        <p className="py-4 text-center text-sm text-slate-500">
                                            Nothing due soon.
                                        </p>
                                    ) : (
                                        upcomingSubscriptions.map((sub) => (
                                            <div
                                                key={sub.id}
                                                className="flex justify-between rounded-xl border border-white/5 bg-white/5 p-3"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                                                        <DynamicIcon
                                                            name={sub.icon}
                                                            fallback={
                                                                CreditCard
                                                            }
                                                            className="h-4 w-4 text-rose-300"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">
                                                            {sub.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Due:{' '}
                                                            {sub.next_billing_date
                                                                ? new Date(
                                                                      sub.next_billing_date,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-rose-400">
                                                    -
                                                    {formatCurrency(
                                                        sub.amount,
                                                        sub.currency,
                                                    )}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </GlassCard>

                            <GlassCard>
                                <div className="flex items-center justify-between border-b border-white/10 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-teal-500/10 p-2">
                                            <TrendingUp className="h-5 w-5 text-teal-400" />
                                        </div>
                                        <h2 className="text-lg font-bold text-white">
                                            Expected Income
                                        </h2>
                                    </div>
                                </div>
                                <div className="space-y-4 p-5">
                                    {upcomingIncome.length === 0 ? (
                                        <p className="py-4 text-center text-sm text-slate-500">
                                            No income arriving soon.
                                        </p>
                                    ) : (
                                        upcomingIncome.map((inc) => (
                                            <div
                                                key={inc.id}
                                                className="flex justify-between rounded-xl border border-white/5 bg-white/5 p-3"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                                                        <DynamicIcon
                                                            name={inc.icon}
                                                            fallback={Wallet}
                                                            className="h-4 w-4 text-teal-300"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">
                                                            {inc.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Expected:{' '}
                                                            {inc.next_expected_date
                                                                ? new Date(
                                                                      inc.next_expected_date,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-teal-400">
                                                    +
                                                    {formatCurrency(
                                                        inc.net_amount ??
                                                            inc.amount,
                                                        inc.currency,
                                                    )}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </GlassCard>
                        </Tabs.Panel>
                    </Tabs.Root>
                </div>
            </div>

            <TransactionFormModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSuccess={fetchRecentTransactions}
            />

            <TransactionFormModal
                open={!!editTransaction}
                onOpenChange={(v) => {
                    if (!v) setEditTransaction(null);
                }}
                transaction={editTransaction}
                onSuccess={fetchRecentTransactions}
            />
        </AppLayout>
    );
}
