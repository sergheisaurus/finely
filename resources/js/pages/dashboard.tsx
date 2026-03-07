import { TransactionFormModal } from '@/components/finance/transaction-form-modal';
import { TransactionList } from '@/components/finance/transaction-list';
import { Button } from '@/components/ui/button';
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
import { Tabs } from '@base-ui/react/tabs';
import { Head, router } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    CalendarClock,
    CreditCard,
    PiggyBank,
    Plus,
    Shield,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

function SurfaceCard({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur ${className}`}
        >
            {children}
        </section>
    );
}

function SectionHeader({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
                <h2 className="text-lg font-semibold text-foreground">
                    {title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            {action}
        </div>
    );
}

function MetricCard({
    title,
    value,
    description,
    icon,
    tone,
}: {
    title: string;
    value: string;
    description: string;
    icon: ReactNode;
    tone: string;
}) {
    return (
        <div className="rounded-[1.5rem] border border-border/70 bg-card/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {value}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                <div className={`rounded-2xl p-3 ${tone}`}>{icon}</div>
            </div>
        </div>
    );
}

const formatDate = (value: string | null | undefined) => {
    if (!value) {
        return 'Not scheduled';
    }

    return new Date(value).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

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
        const response = await api.get('/accounts');
        setAccounts(response.data.data);
    }, []);

    const fetchRecentTransactions = useCallback(async () => {
        const response = await api.get(
            '/transactions?per_page=5&sort_by=transaction_date&sort_dir=desc',
        );
        setTransactions(response.data.data);
    }, []);

    const fetchUpcomingSubscriptions = useCallback(async () => {
        const response = await api.get('/subscriptions/upcoming?days=14');
        setUpcomingSubscriptions(response.data.data);
    }, []);

    const fetchUpcomingIncome = useCallback(async () => {
        const response = await api.get('/recurring-incomes/upcoming?days=14');
        setUpcomingIncome(response.data.data);
    }, []);

    const fetchBudgets = useCallback(async () => {
        const response = await api.get('/budgets?is_active=1&per_page=5');
        setBudgets(response.data.data || []);
    }, []);

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            setIsLoading(true);

            const results = await Promise.allSettled([
                fetchAccounts(),
                fetchRecentTransactions(),
                fetchUpcomingSubscriptions(),
                fetchUpcomingIncome(),
                fetchBudgets(),
            ]);

            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(
                        `Dashboard request ${index + 1} failed`,
                        result.reason,
                    );
                }
            });

            if (active) {
                setIsLoading(false);
            }
        };

        loadData();

        return () => {
            active = false;
        };
    }, [
        fetchAccounts,
        fetchBudgets,
        fetchRecentTransactions,
        fetchUpcomingIncome,
        fetchUpcomingSubscriptions,
        isSecretModeActive,
    ]);

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const currency = accounts[0]?.currency || 'CHF';
    const income = transactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = transactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    const netFlow = income - expenses;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6 py-6 sm:space-y-8 sm:py-8">
                <SurfaceCard className="relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/70 dark:from-card dark:via-card dark:to-emerald-950/20">
                    <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_55%)] lg:block" />
                    <div className="relative grid gap-6 px-5 py-6 sm:px-6 sm:py-7 lg:grid-cols-[1.35fr_0.9fr] lg:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/85 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                <Shield className="h-3.5 w-3.5" />
                                Finely overview
                            </div>
                            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                {isSecretModeActive
                                    ? 'Privacy mode is on.'
                                    : 'Your money, clearer at a glance.'}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                The dashboard now surfaces what matters first:
                                balances, recent movement, upcoming commitments,
                                and budget pressure without the heavy dark UI.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add transaction
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.visit('/accounts/create')
                                    }
                                >
                                    <Wallet className="h-4 w-4" />
                                    New account
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.visit('/budgets')}
                                >
                                    <PiggyBank className="h-4 w-4" />
                                    Review budgets
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            <div className="rounded-[1.5rem] border border-border/70 bg-white/90 p-4 shadow-sm dark:bg-card/90">
                                <p className="text-sm text-muted-foreground">
                                    Accounts tracked
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {accounts.length}
                                </p>
                            </div>
                            <div className="rounded-[1.5rem] border border-border/70 bg-white/90 p-4 shadow-sm dark:bg-card/90">
                                <p className="text-sm text-muted-foreground">
                                    Upcoming bills
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {upcomingSubscriptions.length}
                                </p>
                            </div>
                            <div className="rounded-[1.5rem] border border-border/70 bg-white/90 p-4 shadow-sm dark:bg-card/90">
                                <p className="text-sm text-muted-foreground">
                                    Active budgets
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {budgets.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </SurfaceCard>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        title="Total balance"
                        value={
                            isLoading
                                ? 'Loading...'
                                : formatCurrency(totalBalance, currency)
                        }
                        description="Across all connected accounts"
                        icon={
                            <Wallet className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                        }
                        tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50"
                    />
                    <MetricCard
                        title="Recent income"
                        value={
                            isLoading
                                ? 'Loading...'
                                : formatCurrency(income, currency)
                        }
                        description="Based on your 5 latest transactions"
                        icon={
                            <ArrowDownLeft className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                        }
                        tone="bg-sky-100 text-sky-700 dark:bg-sky-950/50"
                    />
                    <MetricCard
                        title="Recent expenses"
                        value={
                            isLoading
                                ? 'Loading...'
                                : formatCurrency(expenses, currency)
                        }
                        description="Outgoing activity in the same window"
                        icon={
                            <ArrowUpRight className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                        }
                        tone="bg-rose-100 text-rose-700 dark:bg-rose-950/50"
                    />
                    <MetricCard
                        title="Net flow"
                        value={
                            isLoading
                                ? 'Loading...'
                                : `${netFlow >= 0 ? '+' : ''}${formatCurrency(netFlow, currency)}`
                        }
                        description="Quick pulse on short-term momentum"
                        icon={
                            <TrendingUp className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                        }
                        tone="bg-amber-100 text-amber-700 dark:bg-amber-950/50"
                    />
                </div>

                <Tabs.Root defaultValue="overview">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Tabs.List className="inline-flex w-fit rounded-full border border-border/70 bg-card/80 p-1 shadow-sm">
                            <Tabs.Tab
                                value="overview"
                                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition data-[active]:bg-primary data-[active]:text-primary-foreground"
                            >
                                Daily overview
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="planning"
                                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition data-[active]:bg-primary data-[active]:text-primary-foreground"
                            >
                                Planning
                            </Tabs.Tab>
                        </Tabs.List>
                        <Button
                            variant="ghost"
                            onClick={() => router.visit('/journal')}
                        >
                            Open full journal
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Tabs.Panel
                        value="overview"
                        className="mt-5 grid gap-6 xl:grid-cols-[1.4fr_0.95fr]"
                    >
                        <SurfaceCard>
                            <SectionHeader
                                title="Recent transactions"
                                description="The latest activity across your accounts."
                            />
                            <div className="p-4 sm:p-6">
                                <TransactionList
                                    transactions={transactions}
                                    isLoading={isLoading}
                                    onTransactionClick={(transaction) =>
                                        setEditTransaction(transaction)
                                    }
                                />
                            </div>
                        </SurfaceCard>

                        <div className="space-y-6">
                            <SurfaceCard>
                                <SectionHeader
                                    title="Accounts"
                                    description="Where your money currently sits."
                                    action={
                                        <Button
                                            variant="ghost"
                                            onClick={() =>
                                                router.visit('/accounts')
                                            }
                                        >
                                            View all
                                        </Button>
                                    }
                                />
                                <div className="space-y-3 p-4 sm:p-6">
                                    {!isLoading && accounts.length === 0 ? (
                                        <div className="rounded-[1.25rem] border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
                                            No accounts configured yet.
                                        </div>
                                    ) : (
                                        accounts.slice(0, 5).map((account) => (
                                            <button
                                                key={account.id}
                                                type="button"
                                                onClick={() =>
                                                    router.visit(
                                                        `/accounts/${account.id}`,
                                                    )
                                                }
                                                className="flex w-full items-center justify-between rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-3 text-left transition hover:border-primary/25 hover:bg-accent/35"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60"
                                                        style={{
                                                            backgroundColor: `${account.color}20`,
                                                        }}
                                                    >
                                                        <Wallet
                                                            className="h-4 w-4"
                                                            style={{
                                                                color: account.color,
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {account.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground capitalize">
                                                            {account.type}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {formatCurrency(
                                                        account.balance,
                                                        account.currency,
                                                    )}
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </SurfaceCard>
                        </div>
                    </Tabs.Panel>

                    <Tabs.Panel
                        value="planning"
                        className="mt-5 grid gap-6 lg:grid-cols-2"
                    >
                        <SurfaceCard className="lg:col-span-2">
                            <SectionHeader
                                title="Budget health"
                                description="See which spending plans need attention first."
                                action={
                                    <Button
                                        variant="ghost"
                                        onClick={() => router.visit('/budgets')}
                                    >
                                        Open budgets
                                    </Button>
                                }
                            />
                            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
                                {!isLoading && budgets.length === 0 ? (
                                    <div className="rounded-[1.25rem] border border-dashed border-border px-4 py-10 text-center text-muted-foreground sm:col-span-2 xl:col-span-3">
                                        No active budgets yet.
                                    </div>
                                ) : (
                                    budgets.map((budget) => {
                                        const percent = Math.min(
                                            (budget.current_period_spent /
                                                budget.amount) *
                                                100,
                                            100,
                                        );

                                        return (
                                            <button
                                                key={budget.id}
                                                type="button"
                                                onClick={() =>
                                                    router.visit(
                                                        `/budgets/${budget.id}`,
                                                    )
                                                }
                                                className="rounded-[1.4rem] border border-border/70 bg-background/70 p-4 text-left transition hover:border-primary/25 hover:bg-accent/35"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {budget.name}
                                                        </p>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {budget.period}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                                                        {percent.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                                                    <div
                                                        className={`h-full rounded-full ${percent > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                        style={{
                                                            width: `${percent}%`,
                                                        }}
                                                    />
                                                </div>
                                                <div className="mt-3 flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Spent
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                        {formatCurrency(
                                                            budget.current_period_spent,
                                                            budget.currency,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Budget
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                        {formatCurrency(
                                                            budget.amount,
                                                            budget.currency,
                                                        )}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </SurfaceCard>

                        <SurfaceCard>
                            <SectionHeader
                                title="Upcoming subscriptions"
                                description="Bills due in the next two weeks."
                            />
                            <div className="space-y-3 p-4 sm:p-6">
                                {!isLoading &&
                                upcomingSubscriptions.length === 0 ? (
                                    <div className="rounded-[1.25rem] border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
                                        Nothing due soon.
                                    </div>
                                ) : (
                                    upcomingSubscriptions.map(
                                        (subscription) => (
                                            <div
                                                key={subscription.id}
                                                className="flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                                        <DynamicIcon
                                                            name={
                                                                subscription.icon
                                                            }
                                                            fallback={
                                                                CreditCard
                                                            }
                                                            className="h-4 w-4"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {subscription.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Due{' '}
                                                            {formatDate(
                                                                subscription.next_billing_date,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                                                    -
                                                    {formatCurrency(
                                                        subscription.amount,
                                                        subscription.currency,
                                                    )}
                                                </p>
                                            </div>
                                        ),
                                    )
                                )}
                            </div>
                        </SurfaceCard>

                        <SurfaceCard>
                            <SectionHeader
                                title="Expected income"
                                description="Incoming money scheduled in the next two weeks."
                            />
                            <div className="space-y-3 p-4 sm:p-6">
                                {!isLoading && upcomingIncome.length === 0 ? (
                                    <div className="rounded-[1.25rem] border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
                                        No income arriving soon.
                                    </div>
                                ) : (
                                    upcomingIncome.map((incomeItem) => (
                                        <div
                                            key={incomeItem.id}
                                            className="flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                    <DynamicIcon
                                                        name={incomeItem.icon}
                                                        fallback={CalendarClock}
                                                        className="h-4 w-4"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {incomeItem.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Expected{' '}
                                                        {formatDate(
                                                            incomeItem.next_expected_date,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                                                +
                                                {formatCurrency(
                                                    incomeItem.net_amount ??
                                                        incomeItem.amount,
                                                    incomeItem.currency,
                                                )}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </SurfaceCard>
                    </Tabs.Panel>
                </Tabs.Root>
            </div>

            <TransactionFormModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSuccess={fetchRecentTransactions}
            />

            <TransactionFormModal
                open={!!editTransaction}
                onOpenChange={(value) => {
                    if (!value) {
                        setEditTransaction(null);
                    }
                }}
                transaction={editTransaction}
                onSuccess={fetchRecentTransactions}
            />
        </AppLayout>
    );
}
