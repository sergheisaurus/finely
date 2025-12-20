import { AmountInput } from '@/components/finance/amount-input';
import { Button } from '@/components/ui/button';
import { Card as CardUI, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { journal } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import type { BankAccount, Card, Category, Merchant, Transaction } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TransactionEditProps {
    transactionId: string;
}

type TransactionType = 'income' | 'expense' | 'transfer' | 'card_payment';

export default function TransactionEdit({ transactionId }: TransactionEditProps) {
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form fields
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('0');
    const [currency, setCurrency] = useState('CHF');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [transactionDate, setTransactionDate] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [fromAccountId, setFromAccountId] = useState('');
    const [fromCardId, setFromCardId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [toCardId, setToCardId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [merchantId, setMerchantId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>('account');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Journal',
            href: journal().url,
        },
        {
            title: transaction?.title || 'Edit',
            href: `/journal/${transactionId}/edit`,
        },
    ];

    useEffect(() => {
        Promise.all([
            fetchTransaction(),
            fetchAccounts(),
            fetchCards(),
            fetchCategories(),
            fetchMerchants(),
        ]).finally(() => setIsLoadingData(false));
    }, [transactionId]);

    const fetchTransaction = async () => {
        try {
            const response = await api.get(`/transactions/${transactionId}`);
            const data = response.data.data;
            setTransaction(data);

            // Populate form fields
            setType(data.type);
            setAmount(parseFloat(data.amount || 0).toFixed(2));
            setCurrency(data.currency);
            setTitle(data.title);
            setDescription(data.description || '');
            setTransactionDate(data.transaction_date);
            setFromAccountId(data.from_account_id?.toString() || '');
            setFromCardId(data.from_card_id?.toString() || '');
            setToAccountId(data.to_account_id?.toString() || '');
            setToCardId(data.to_card_id?.toString() || '');
            setCategoryId(data.category_id?.toString() || '');
            setMerchantId(data.merchant_id?.toString() || '');

            // Determine payment method based on whether card or account is used
            if (data.type === 'expense' || data.type === 'income') {
                if (data.from_card_id || data.to_card_id) {
                    setPaymentMethod('card');
                } else {
                    setPaymentMethod('account');
                }
            }
        } catch (error) {
            console.error('Failed to fetch transaction:', error);
            toast.error('Failed to load transaction');
            router.visit(journal().url);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    };

    const fetchCards = async () => {
        try {
            const response = await api.get('/cards');
            setCards(response.data.data);
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchMerchants = async () => {
        try {
            const response = await api.get('/merchants');
            setMerchants(response.data.data);
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
        }
    };

    // Reset account/card fields when payment method changes
    useEffect(() => {
        if (type === 'expense' || type === 'income') {
            if (paymentMethod === 'account') {
                setFromCardId('');
                setToCardId('');
            } else {
                setFromAccountId('');
                setToAccountId('');
            }
        }
    }, [paymentMethod, type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const payload: any = {
                type,
                amount: parseFloat(amount) || 0,
                currency,
                title,
                description: description || undefined,
                transaction_date: transactionDate,
            };

            // Add type-specific fields
            if (type === 'expense') {
                if (fromAccountId) {
                    payload.from_account_id = parseInt(fromAccountId);
                } else {
                    payload.from_account_id = null;
                }
                if (fromCardId) {
                    payload.from_card_id = parseInt(fromCardId);
                } else {
                    payload.from_card_id = null;
                }
                if (categoryId) {
                    payload.category_id = parseInt(categoryId);
                } else {
                    payload.category_id = null;
                }
                if (merchantId) {
                    payload.merchant_id = parseInt(merchantId);
                } else {
                    payload.merchant_id = null;
                }
            } else if (type === 'income') {
                if (toAccountId) {
                    payload.to_account_id = parseInt(toAccountId);
                } else {
                    payload.to_account_id = null;
                }
                if (toCardId) {
                    payload.to_card_id = parseInt(toCardId);
                } else {
                    payload.to_card_id = null;
                }
                if (categoryId) {
                    payload.category_id = parseInt(categoryId);
                } else {
                    payload.category_id = null;
                }
                if (merchantId) {
                    payload.merchant_id = parseInt(merchantId);
                } else {
                    payload.merchant_id = null;
                }
            } else if (type === 'transfer') {
                if (fromAccountId) {
                    payload.from_account_id = parseInt(fromAccountId);
                } else {
                    payload.from_account_id = null;
                }
                if (toAccountId) {
                    payload.to_account_id = parseInt(toAccountId);
                } else {
                    payload.to_account_id = null;
                }
            } else if (type === 'card_payment') {
                if (fromAccountId) {
                    payload.from_account_id = parseInt(fromAccountId);
                } else {
                    payload.from_account_id = null;
                }
                if (toCardId) {
                    payload.to_card_id = parseInt(toCardId);
                } else {
                    payload.to_card_id = null;
                }
            }

            await api.put(`/transactions/${transactionId}`, payload);

            toast.success('Transaction updated successfully!', {
                description: `${title} has been updated.`,
            });

            router.visit(journal().url);
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to update transaction:', error);
                toast.error('Failed to update transaction', {
                    description: 'Please try again.',
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit Transaction" />
                <div className="mx-auto max-w-3xl space-y-6 p-6">
                    <div className="h-96 animate-pulse rounded-lg bg-muted" />
                </div>
            </AppLayout>
        );
    }

    if (!transaction) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Transaction Not Found" />
                <div className="mx-auto max-w-3xl p-6">
                    <CardUI>
                        <CardContent className="p-12 text-center">
                            <h3 className="text-lg font-semibold">
                                Transaction not found
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                The transaction you're looking for doesn't exist
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() => router.visit(journal().url)}
                            >
                                Back to Journal
                            </Button>
                        </CardContent>
                    </CardUI>
                </div>
            </AppLayout>
        );
    }

    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const incomeCategories = categories.filter((c) => c.type === 'income');
    const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${transaction.title}`} />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">Edit Transaction</h1>
                    <p className="text-muted-foreground">
                        Update transaction details
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <CardUI>
                        <CardHeader>
                            <CardTitle>Transaction Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type *</Label>
                                    <Select
                                        value={type}
                                        onValueChange={(value: any) => setType(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expense">Expense</SelectItem>
                                            <SelectItem value="income">Income</SelectItem>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                            <SelectItem value="card_payment">
                                                Card Payment
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-red-500">{errors.type}</p>
                                    )}
                                </div>

                                {/* Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="transaction_date">Date *</Label>
                                    <Input
                                        id="transaction_date"
                                        type="date"
                                        value={transactionDate}
                                        onChange={(e) => setTransactionDate(e.target.value)}
                                        required
                                    />
                                    {errors.transaction_date && (
                                        <p className="text-sm text-red-500">
                                            {errors.transaction_date}
                                        </p>
                                    )}
                                </div>

                                {/* Title */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Grocery shopping"
                                        required
                                        maxLength={255}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-500">{errors.title}</p>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount *</Label>
                                    <AmountInput
                                        name="amount"
                                        value={parseFloat(amount) || 0}
                                        onChange={(value) => setAmount(value.toString())}
                                        currency={currency}
                                        required
                                    />
                                    {errors.amount && (
                                        <p className="text-sm text-red-500">{errors.amount}</p>
                                    )}
                                </div>

                                {/* Currency */}
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency *</Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CHF">CHF</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.currency && (
                                        <p className="text-sm text-red-500">{errors.currency}</p>
                                    )}
                                </div>

                                {/* Expense fields */}
                                {type === 'expense' && (
                                    <>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="payment_method">
                                                Payment Method *
                                            </Label>
                                            <Select
                                                value={paymentMethod}
                                                onValueChange={(value: any) =>
                                                    setPaymentMethod(value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="account">
                                                        Bank Account
                                                    </SelectItem>
                                                    <SelectItem value="card">
                                                        Card
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {paymentMethod === 'account' ? (
                                            <div className="space-y-2">
                                                <Label htmlFor="from_account">
                                                    From Account *
                                                </Label>
                                                <Select
                                                    value={fromAccountId}
                                                    onValueChange={setFromAccountId}
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
                                                                {account.name} ({account.currency}{' '}
                                                                {account.balance.toFixed(2)})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.from_account_id && (
                                                    <p className="text-sm text-red-500">
                                                        {errors.from_account_id}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label htmlFor="from_card">
                                                    From Card *
                                                </Label>
                                                <Select
                                                    value={fromCardId}
                                                    onValueChange={setFromCardId}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select card" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {cards.map((card) => (
                                                            <SelectItem
                                                                key={card.id}
                                                                value={card.id.toString()}
                                                            >
                                                                {card.card_holder_name} (••••{' '}
                                                                {card.card_number?.slice(-4)})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.from_card_id && (
                                                    <p className="text-sm text-red-500">
                                                        {errors.from_card_id}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category (Optional)</Label>
                                            <Select value={categoryId} onValueChange={setCategoryId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currentCategories.map((category) => (
                                                        <SelectItem
                                                            key={category.id}
                                                            value={category.id.toString()}
                                                        >
                                                            {category.parent && '└ '}
                                                            {category.icon} {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="merchant">Merchant (Optional)</Label>
                                            <Select value={merchantId} onValueChange={setMerchantId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select merchant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {merchants.map((merchant) => (
                                                        <SelectItem
                                                            key={merchant.id}
                                                            value={merchant.id.toString()}
                                                        >
                                                            {merchant.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {/* Income fields */}
                                {type === 'income' && (
                                    <>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="deposit_to">
                                                Deposit To *
                                            </Label>
                                            <Select
                                                value={paymentMethod}
                                                onValueChange={(value: any) =>
                                                    setPaymentMethod(value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="account">
                                                        Bank Account
                                                    </SelectItem>
                                                    <SelectItem value="card">
                                                        Card (Cashback/Refund)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {paymentMethod === 'account' ? (
                                            <div className="space-y-2">
                                                <Label htmlFor="to_account">
                                                    To Account *
                                                </Label>
                                                <Select
                                                    value={toAccountId}
                                                    onValueChange={setToAccountId}
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
                                                                {account.name} ({account.currency}{' '}
                                                                {account.balance.toFixed(2)})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.to_account_id && (
                                                    <p className="text-sm text-red-500">
                                                        {errors.to_account_id}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label htmlFor="to_card">
                                                    To Card *
                                                </Label>
                                                <Select
                                                    value={toCardId}
                                                    onValueChange={setToCardId}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select card" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {cards.map((card) => (
                                                            <SelectItem
                                                                key={card.id}
                                                                value={card.id.toString()}
                                                            >
                                                                {card.card_holder_name} (••••{' '}
                                                                {card.card_number?.slice(-4)})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.to_card_id && (
                                                    <p className="text-sm text-red-500">
                                                        {errors.to_card_id}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category (Optional)</Label>
                                            <Select value={categoryId} onValueChange={setCategoryId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currentCategories.map((category) => (
                                                        <SelectItem
                                                            key={category.id}
                                                            value={category.id.toString()}
                                                        >
                                                            {category.parent && '└ '}
                                                            {category.icon} {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="merchant">Merchant (Optional)</Label>
                                            <Select value={merchantId} onValueChange={setMerchantId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select merchant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {merchants.map((merchant) => (
                                                        <SelectItem
                                                            key={merchant.id}
                                                            value={merchant.id.toString()}
                                                        >
                                                            {merchant.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {/* Transfer fields */}
                                {type === 'transfer' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="from_account">From Account *</Label>
                                            <Select
                                                value={fromAccountId}
                                                onValueChange={setFromAccountId}
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
                                                            {account.name} ({account.currency}{' '}
                                                            {account.balance.toFixed(2)})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.from_account_id && (
                                                <p className="text-sm text-red-500">
                                                    {errors.from_account_id}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="to_account">To Account *</Label>
                                            <Select
                                                value={toAccountId}
                                                onValueChange={setToAccountId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts
                                                        .filter(
                                                            (acc) =>
                                                                acc.id.toString() !== fromAccountId,
                                                        )
                                                        .map((account) => (
                                                            <SelectItem
                                                                key={account.id}
                                                                value={account.id.toString()}
                                                            >
                                                                {account.name} ({account.currency}{' '}
                                                                {account.balance.toFixed(2)})
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.to_account_id && (
                                                <p className="text-sm text-red-500">
                                                    {errors.to_account_id}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Card Payment fields */}
                                {type === 'card_payment' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="from_account">From Account *</Label>
                                            <Select
                                                value={fromAccountId}
                                                onValueChange={setFromAccountId}
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
                                                            {account.name} ({account.currency}{' '}
                                                            {account.balance.toFixed(2)})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.from_account_id && (
                                                <p className="text-sm text-red-500">
                                                    {errors.from_account_id}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="to_card">To Card *</Label>
                                            <Select value={toCardId} onValueChange={setToCardId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select card" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cards.map((card) => (
                                                        <SelectItem
                                                            key={card.id}
                                                            value={card.id.toString()}
                                                        >
                                                            {card.card_holder_name} (••••{' '}
                                                            {card.card_number?.slice(-4)})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.to_card_id && (
                                                <p className="text-sm text-red-500">
                                                    {errors.to_card_id}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Description */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add notes about this transaction..."
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-500">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    <div className="mt-6 flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(journal().url)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Transaction'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
