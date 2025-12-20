import { AmountInput } from '@/components/finance/amount-input';
import { TransactionList } from '@/components/finance/transaction-list';
import { Button } from '@/components/ui/button';
import { Card as CardUI, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { BankAccount, Card, Transaction } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { Banknote, Copy, CreditCard, Edit, Star, Trash2, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CardViewProps {
    cardId: string;
}

export default function CardView({ cardId }: CardViewProps) {
    const [card, setCard] = useState<Card | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);

    // Pay Balance Dialog
    const [showPayDialog, setShowPayDialog] = useState(false);
    const [payAmount, setPayAmount] = useState('0');
    const [payFromAccount, setPayFromAccount] = useState('');
    const [isPayingBalance, setIsPayingBalance] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Cards',
            href: '/cards',
        },
        {
            title: card?.card_holder_name || 'Card',
            href: `/cards/${cardId}`,
        },
    ];

    useEffect(() => {
        Promise.all([fetchCard(), fetchTransactions(), fetchAccounts()]).finally(() =>
            setIsLoading(false),
        );
    }, [cardId]);

    const fetchCard = async () => {
        try {
            const response = await api.get(`/cards/${cardId}`);
            setCard(response.data.data);
        } catch (error) {
            console.error('Failed to fetch card:', error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await api.get(
                `/transactions?card_id=${cardId}&per_page=10&sort_by=transaction_date&sort_dir=desc`,
            );
            setTransactions(response.data.data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data.data);
            // Set default account
            const defaultAccount = response.data.data.find(
                (acc: BankAccount) => acc.is_default,
            );
            if (defaultAccount) {
                setPayFromAccount(defaultAccount.id.toString());
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    };

    const handleSetDefault = async () => {
        if (!card) return;

        try {
            await api.post(`/cards/${card.id}/set-default`);
            await fetchCard();
            toast.success('Default card updated!', {
                description: `${card.card_holder_name} is now your default card.`,
            });
        } catch (error) {
            console.error('Failed to set default card:', error);
        }
    };

    const handleDelete = async () => {
        if (!card) return;
        if (!confirm('Are you sure you want to delete this card?')) {
            return;
        }

        try {
            await api.delete(`/cards/${card.id}`);
            toast.success('Card deleted!', {
                description: `${card.card_holder_name} has been removed.`,
            });
            router.visit('/cards');
        } catch (error) {
            console.error('Failed to delete card:', error);
        }
    };

    const copyCardDetails = () => {
        if (!card) return;

        const details = `Card Number: ${card.card_number}
Card Holder: ${card.card_holder_name}
Expiry: ${String(card.expiry_month).padStart(2, '0')}/${card.expiry_year}
Network: ${card.card_network}`;

        navigator.clipboard.writeText(details);
        toast.success('Card details copied!', {
            description: 'Card information copied to clipboard',
        });
    };

    const openPayDialog = () => {
        if (card) {
            setPayAmount(card.current_balance.toFixed(2));
        }
        setShowPayDialog(true);
    };

    const handlePayBalance = async () => {
        if (!card || !payFromAccount) return;

        const amount = parseFloat(payAmount);
        if (amount <= 0) {
            toast.error('Invalid amount', {
                description: 'Please enter a valid payment amount.',
            });
            return;
        }

        setIsPayingBalance(true);

        try {
            await api.post('/transactions', {
                type: 'card_payment',
                amount: amount,
                currency: card.currency || 'CHF',
                title: `Payment to ${card.card_holder_name}`,
                description: `Card payment - last 4 digits: ${card.card_number?.slice(-4)}`,
                transaction_date: new Date().toISOString().split('T')[0],
                from_account_id: parseInt(payFromAccount),
                to_card_id: card.id,
            });

            toast.success('Payment successful!', {
                description: `${formatCurrency(amount, card.currency)} has been paid to your credit card.`,
            });

            setShowPayDialog(false);
            setPayAmount('0');
            await Promise.all([fetchCard(), fetchTransactions()]);
        } catch (error: any) {
            console.error('Failed to pay balance:', error);
            toast.error('Payment failed', {
                description: error.response?.data?.message || 'Please try again.',
            });
        } finally {
            setIsPayingBalance(false);
        }
    };

    const formatCardNumber = (number?: string) => {
        if (!number) return '•••• •••• •••• ••••';
        return number.replace(/(\d{4})/g, '$1 ').trim();
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

    if (!card) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Card Not Found" />
                <div className="p-6">
                    <CardUI>
                        <CardContent className="p-12 text-center">
                            <h3 className="text-lg font-semibold">
                                Card not found
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                The card you're looking for doesn't exist
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() => router.visit('/cards')}
                            >
                                Back to Cards
                            </Button>
                        </CardContent>
                    </CardUI>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${card.card_holder_name} - ${card.card_network}`} />
            <div className="space-y-6 p-6">
                {/* Card Visual */}
                <CardUI
                    className="overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
                    }}
                >
                    <CardContent className="p-8 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-8 w-8" />
                                    <div>
                                        <h1 className="text-2xl font-bold">
                                            {card.card_holder_name}
                                        </h1>
                                        <p className="text-sm opacity-90">
                                            {card.type === 'debit'
                                                ? 'Debit Card'
                                                : 'Credit Card'}
                                        </p>
                                    </div>
                                    {card.is_default && (
                                        <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                                    )}
                                </div>

                                <div className="mt-6">
                                    <p className="text-sm opacity-75">Card Number</p>
                                    <p className="font-mono text-xl font-semibold tracking-wider">
                                        {formatCardNumber(card.card_number)}
                                    </p>
                                </div>

                                <div className="mt-4 flex gap-8">
                                    <div>
                                        <p className="text-xs opacity-75">Expires</p>
                                        <p className="font-mono font-semibold">
                                            {String(card.expiry_month).padStart(
                                                2,
                                                '0',
                                            )}
                                            /{String(card.expiry_year).slice(-2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs opacity-75">Network</p>
                                        <p className="font-semibold uppercase">
                                            {card.card_network}
                                        </p>
                                    </div>
                                    {card.bank_account && (
                                        <div>
                                            <p className="text-xs opacity-75">
                                                Linked Account
                                            </p>
                                            <p className="font-semibold">
                                                {card.bank_account.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={copyCardDetails}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Details
                                </Button>
                                {!card.is_default && (
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
                                        router.visit(`/cards/${card.id}/edit`)
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
                    </CardContent>
                </CardUI>

                {/* Credit Card Info */}
                {card.type === 'credit' && (
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <CardUI>
                                <CardContent className="p-6">
                                    <p className="text-sm text-muted-foreground">
                                        Current Balance
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {formatCurrency(
                                            card.current_balance,
                                            card.currency,
                                        )}
                                    </p>
                                </CardContent>
                            </CardUI>

                            {card.credit_limit && (
                                <>
                                    <CardUI>
                                        <CardContent className="p-6">
                                            <p className="text-sm text-muted-foreground">
                                                Credit Limit
                                            </p>
                                            <p className="mt-2 text-2xl font-bold">
                                                {formatCurrency(
                                                    card.credit_limit,
                                                    card.currency,
                                                )}
                                            </p>
                                        </CardContent>
                                    </CardUI>

                                    <CardUI>
                                        <CardContent className="p-6">
                                            <p className="text-sm text-muted-foreground">
                                                Available Credit
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-green-600">
                                                {formatCurrency(
                                                    card.available_credit || 0,
                                                    card.currency,
                                                )}
                                            </p>
                                        </CardContent>
                                    </CardUI>
                                </>
                            )}
                        </div>

                        {card.current_balance > 0 && (
                            <Button
                                onClick={openPayDialog}
                                className="w-full md:w-auto"
                            >
                                <Banknote className="mr-2 h-4 w-4" />
                                Pay Balance
                            </Button>
                        )}
                    </div>
                )}

                {/* Recent Transactions */}
                <CardUI>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Transactions</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                router.visit(`/journal?card_id=${card.id}`)
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

            {/* Pay Balance Dialog */}
            <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pay Credit Card Balance</DialogTitle>
                        <DialogDescription>
                            Make a payment toward your credit card balance of{' '}
                            {card && formatCurrency(card.current_balance, card.currency)}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="pay-amount">Payment Amount</Label>
                            <AmountInput
                                name="pay-amount"
                                value={parseFloat(payAmount) || 0}
                                onChange={(value) => setPayAmount(value.toString())}
                                currency={card?.currency || 'CHF'}
                            />
                            {card && card.current_balance > 0 && (
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs"
                                    onClick={() =>
                                        setPayAmount(card.current_balance.toFixed(2))
                                    }
                                >
                                    Pay full balance
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pay-from-account">From Account</Label>
                            <Select
                                value={payFromAccount}
                                onValueChange={setPayFromAccount}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((account) => (
                                        <SelectItem
                                            key={account.id}
                                            value={account.id.toString()}
                                        >
                                            {account.name} ({formatCurrency(account.balance, account.currency)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowPayDialog(false)}
                            disabled={isPayingBalance}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePayBalance}
                            disabled={isPayingBalance || !payFromAccount}
                        >
                            {isPayingBalance ? 'Processing...' : 'Pay Now'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
