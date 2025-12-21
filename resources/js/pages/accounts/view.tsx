import { AccountTypeBadge } from '@/components/finance/account-type-badge';
import { TransactionList } from '@/components/finance/transaction-list';
import { Button } from '@/components/ui/button';
import { Card as CardUI, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { BankAccount, Card, Transaction } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { Building2, CreditCard, Edit, Star, Trash2, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AccountViewProps {
    accountId: string;
}

export default function AccountView({ accountId }: AccountViewProps) {
    const [account, setAccount] = useState<BankAccount | null>(null);
    const [linkedCards, setLinkedCards] = useState<Card[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Accounts',
            href: '/accounts',
        },
        {
            title: account?.name || 'Account',
            href: `/accounts/${accountId}`,
        },
    ];

    const fetchAccount = useCallback(async () => {
        try {
            const response = await api.get(`/accounts/${accountId}`);
            setAccount(response.data.data);
        } catch (error) {
            console.error('Failed to fetch account:', error);
        }
    }, [accountId]);

    const fetchTransactions = useCallback(async () => {
        try {
            const response = await api.get(
                `/transactions?account_id=${accountId}&per_page=10&sort_by=transaction_date&sort_dir=desc`,
            );
            setTransactions(response.data.data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    }, [accountId]);

    const fetchLinkedCards = useCallback(async () => {
        try {
            const response = await api.get(
                `/cards?bank_account_id=${accountId}`,
            );
            setLinkedCards(response.data.data);
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        }
    }, [accountId]);

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchAccount(), fetchTransactions(), fetchLinkedCards()]);
            setIsLoading(false);
        };
        loadData();
    }, [fetchAccount, fetchTransactions, fetchLinkedCards]);

    const handleSetDefault = async () => {
        if (!account) return;

        try {
            await api.post(`/accounts/${account.id}/set-default`);
            await fetchAccount();
            toast.success('Default account updated!', {
                description: `${account.name} is now your default account.`,
            });
        } catch (error) {
            console.error('Failed to set default account:', error);
        }
    };

    const handleDelete = async () => {
        if (!account) return;
        if (!confirm('Are you sure you want to delete this account?')) {
            return;
        }

        try {
            await api.delete(`/accounts/${account.id}`);
            toast.success('Account deleted!', {
                description: `${account.name} has been removed.`,
            });
            router.visit('/accounts');
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Loading..." />
                <div className="space-y-6 p-6">
                    <div className="h-64 animate-pulse rounded-lg bg-muted" />
                    <div className="h-96 animate-pulse rounded-lg bg-muted" />
                </div>
            </AppLayout>
        );
    }

    if (!account) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Account Not Found" />
                <div className="p-6">
                    <CardUI>
                        <CardContent className="p-12 text-center">
                            <h3 className="text-lg font-semibold">
                                Account not found
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                The account you're looking for doesn't exist
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() => router.visit('/accounts')}
                            >
                                Back to Accounts
                            </Button>
                        </CardContent>
                    </CardUI>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={account.name} />
            <div className="space-y-6 p-6">
                <CardUI
                    className="overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${account.color} 0%, ${account.color}dd 100%)`,
                    }}
                >
                    <CardContent className="p-8 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/20">
                                    <Building2 className="h-10 w-10" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-3xl font-bold">
                                            {account.name}
                                        </h1>
                                        {account.is_default && (
                                            <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                                        )}
                                    </div>
                                    <p className="mt-1 text-lg opacity-90">
                                        {account.bank_name || 'No bank name'}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <AccountTypeBadge type={account.type} />
                                        {account.account_number && (
                                            <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
                                                {account.account_number}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-4">
                                <div className="text-right">
                                    <p className="text-sm opacity-90">Balance</p>
                                    <p className="text-4xl font-bold">
                                        {formatCurrency(
                                            account.balance,
                                            account.currency,
                                        )}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    {!account.is_default && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleSetDefault}
                                        >
                                            <Star className="mr-2 h-4 w-4" />
                                            Set Default
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            router.visit(
                                                `/accounts/${account.id}/edit`,
                                            )
                                        }
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </CardUI>

                {linkedCards.length > 0 && (
                    <CardUI>
                        <CardHeader>
                            <CardTitle>Linked Cards</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {linkedCards.map((card) => (
                                    <div
                                        key={card.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                        onClick={() =>
                                            router.visit(`/cards/${card.id}`)
                                        }
                                    >
                                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">
                                                {card.card_holder_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {card.card_number
                                                    ? card.card_number.replace(/(\d{4})/g, '$1 ').trim()
                                                    : 'No card number'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </CardUI>
                )}

                <CardUI>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Transactions</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                router.visit(`/journal?account_id=${account.id}`)
                            }
                        >
                            View All
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <TransactionList
                            transactions={transactions}
                            isLoading={false}
                            onTransactionClick={(transaction) => {
                                console.log('View transaction:', transaction);
                            }}
                        />
                        {transactions.length === 0 && (
                            <div className="py-8 text-center">
                                <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-sm text-muted-foreground">
                                    No transactions yet
                                </p>
                            </div>
                        )}
                    </CardContent>
                </CardUI>
            </div>
        </AppLayout>
    );
}
