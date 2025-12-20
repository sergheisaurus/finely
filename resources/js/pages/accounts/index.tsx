import { AccountTypeBadge } from '@/components/finance/account-type-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { BankAccount } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    Building2,
    ChevronRight,
    CreditCard,
    PiggyBank,
    Plus,
    Star,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounts',
        href: '/accounts',
    },
];

export default function AccountsIndex() {
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setBankAccounts(response.data.data);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetDefault = async (accountId: number) => {
        try {
            const account = bankAccounts.find(acc => acc.id === accountId);
            await api.post(`/accounts/${accountId}/set-default`);
            await fetchAccounts();
            toast.success('Default account updated!', {
                description: `${account?.name} is now your default account.`,
            });
        } catch (error) {
            console.error('Failed to set default account:', error);
        }
    };

    const handleDelete = async (accountId: number) => {
        const account = bankAccounts.find(acc => acc.id === accountId);
        if (!confirm(`Are you sure you want to delete ${account?.name}?`)) {
            return;
        }

        try {
            await api.delete(`/accounts/${accountId}`);
            toast.success('Account deleted!', {
                description: `${account?.name} has been removed.`,
            });
            await fetchAccounts();
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    };

    const totalBalance = bankAccounts.reduce(
        (sum, acc) => sum + acc.balance,
        0,
    );
    const currency = bankAccounts[0]?.currency || 'EUR';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bank Accounts" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
                    <div>
                        <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                            Bank Accounts
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your bank accounts and balances
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/accounts/create')}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Account
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="animate-fade-in-up stagger-1 opacity-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Total Balance
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl tabular-nums">
                                        {formatCurrency(totalBalance, currency)}
                                    </p>
                                </div>
                                <PiggyBank className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-2 opacity-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Total Accounts
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {bankAccounts.length}
                                    </p>
                                </div>
                                <Building2 className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-3 opacity-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover-lift sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Linked Cards
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {bankAccounts.reduce(
                                            (sum, acc) =>
                                                sum + (acc.cards_count || 0),
                                            0,
                                        )}
                                    </p>
                                </div>
                                <CreditCard className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4 animate-fade-in-up stagger-4 opacity-0">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardContent className="p-6">
                                        <div className="h-20 animate-pulse rounded-lg bg-muted" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : bankAccounts.length === 0 ? (
                        <Card className="overflow-hidden">
                            <CardContent className="p-12 text-center">
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50">
                                    <Building2 className="h-10 w-10 text-blue-500" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">
                                    No accounts yet
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Get started by creating your first bank account
                                </p>
                                <Button
                                    className="mt-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                                    onClick={() =>
                                        router.visit('/accounts/create')
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Account
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        bankAccounts.map((account, index) => (
                            <Card
                                key={account.id}
                                className="group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg hover-lift"
                                onClick={() =>
                                    router.visit(`/accounts/${account.id}`)
                                }
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                                                style={{
                                                    backgroundColor: account.color,
                                                }}
                                            >
                                                <Building2 className="h-6 w-6 md:h-8 md:w-8 text-white" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg md:text-xl font-bold">
                                                        {account.name}
                                                    </h3>
                                                    {account.is_default && (
                                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {account.bank_name || 'No bank name'}
                                                </p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <AccountTypeBadge
                                                        type={account.type}
                                                    />
                                                    {account.cards_count !==
                                                        undefined &&
                                                        account.cards_count > 0 && (
                                                            <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                                                {account.cards_count}{' '}
                                                                card
                                                                {account.cards_count !==
                                                                    1 && 's'}
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:gap-4">
                                            <div className="text-left md:text-right">
                                                <p className="text-sm text-muted-foreground">
                                                    Balance
                                                </p>
                                                <p className="text-xl md:text-2xl font-bold tabular-nums">
                                                    {formatCurrency(
                                                        account.balance,
                                                        account.currency,
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                {!account.is_default && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetDefault(
                                                                account.id,
                                                            );
                                                        }}
                                                        className="hidden lg:flex"
                                                    >
                                                        <Star className="mr-2 h-4 w-4" />
                                                        Set Default
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.visit(
                                                            `/accounts/${account.id}/edit`,
                                                        );
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(account.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="hidden md:flex"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
