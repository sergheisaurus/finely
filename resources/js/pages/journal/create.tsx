import { AmountInput } from '@/components/finance/amount-input';
import { BudgetIndicator } from '@/components/finance/budget-indicator';
import { CategorySelect } from '@/components/finance/category-select';
import { MerchantSelect } from '@/components/finance/merchant-select';
import { Button } from '@/components/ui/button';
import {
    CardContent,
    CardHeader,
    CardTitle,
    Card as CardUI,
} from '@/components/ui/card';
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
import type { BankAccount, Card, Category, Merchant } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Journal',
        href: journal().url,
    },
    {
        title: 'Create',
        href: '/journal/create',
    },
];

type TransactionType = 'income' | 'expense' | 'transfer' | 'card_payment';

export default function TransactionCreate({
    accounts: initialAccounts,
    cards: initialCards,
    categories: initialCategories,
    merchants: initialMerchants,
}: {
    accounts: { data: BankAccount[] };
    cards: { data: Card[] };
    categories: { data: Category[] };
    merchants: { data: Merchant[] };
}) {
    const [accounts, setAccounts] = useState<BankAccount[]>(
        initialAccounts.data,
    );
    const [cards, setCards] = useState<Card[]>(initialCards.data);
    const [categories, setCategories] = useState<Category[]>(
        initialCategories.data,
    );
    const [merchants, setMerchants] = useState<Merchant[]>(
        initialMerchants.data,
    );
    const [isLoadingData, setIsLoadingData] = useState(false);
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
    const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>(
        'account',
    );

    // Initial default account selection - Only runs once on mount if accounts are already loaded
    useEffect(() => {
        // This effect is largely redundant now due to the smart reset above,
        // but kept for initial load if type doesn't change.
        const defaultAccount = accounts.find((acc) => acc.is_default);

        if (defaultAccount) {
            if (type === 'expense' && !fromAccountId) {
                setFromAccountId(defaultAccount.id.toString());
            }
        }
    }, []);

    useEffect(() => {
        setAccounts(initialAccounts.data);
        setCards(initialCards.data);
        setCategories(initialCategories.data);
        setMerchants(initialMerchants.data);
    }, [initialAccounts, initialCards, initialCategories, initialMerchants]);

    // Reset relevant fields when transaction type changes, but preserve default accounts
    useEffect(() => {
        setFromCardId('');
        setToCardId('');
        setCategoryId('');
        setPaymentMethod('account');
        setErrors({});

        const defaultAccount = accounts.find((acc) => acc.is_default);
        const defaultId = defaultAccount ? defaultAccount.id.toString() : '';

        // Smart reset: Set default account where applicable, otherwise clear
        if (type === 'expense') {
            setFromAccountId(defaultId);
            setToAccountId('');
        } else if (type === 'income') {
            setFromAccountId('');
            setToAccountId(defaultId);
        } else if (type === 'transfer') {
            setFromAccountId(defaultId);
            setToAccountId('');
        } else if (type === 'card_payment') {
            setFromAccountId(defaultId);
            setToAccountId('');
        }
    }, [type, accounts]); // Added accounts dependency so it re-runs if accounts load later

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

    const handleCategoryCreated = (newCategory: Category) => {
        setCategories((prev) =>
            [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)),
        );
    };

    const handleMerchantCreated = (newMerchant: Merchant) => {
        setMerchants((prev) =>
            [...prev, newMerchant].sort((a, b) => a.name.localeCompare(b.name)),
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const payload: Record<string, unknown> = {
                type,
                amount: parseFloat(amount) || 0,
                currency,
                title,
                description: description || undefined,
                transaction_date: transactionDate,
            };

            // Add type-specific fields
            if (type === 'expense') {
                if (fromAccountId)
                    payload.from_account_id = parseInt(fromAccountId);
                if (fromCardId) payload.from_card_id = parseInt(fromCardId);
                if (categoryId) payload.category_id = parseInt(categoryId);
                if (merchantId) payload.merchant_id = parseInt(merchantId);
            } else if (type === 'income') {
                if (toAccountId) payload.to_account_id = parseInt(toAccountId);
                if (toCardId) payload.to_card_id = parseInt(toCardId);
                if (categoryId) payload.category_id = parseInt(categoryId);
                if (merchantId) payload.merchant_id = parseInt(merchantId);
            } else if (type === 'transfer') {
                if (fromAccountId)
                    payload.from_account_id = parseInt(fromAccountId);
                if (toAccountId) payload.to_account_id = parseInt(toAccountId);
            } else if (type === 'card_payment') {
                if (fromAccountId)
                    payload.from_account_id = parseInt(fromAccountId);
                if (toCardId) payload.to_card_id = parseInt(toCardId);
            }

            await api.post('/transactions', payload);

            toast.success('Transaction created successfully!', {
                description: `${title} has been recorded.`,
            });

            router.visit(journal().url);
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string> } };
            };
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                console.error('Failed to create transaction:', error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Create Transaction" />
                <div className="mx-auto max-w-3xl space-y-6 p-6">
                    <div className="h-96 animate-pulse rounded-lg bg-muted" />
                </div>
            </AppLayout>
        );
    }

    // Get credit cards only for card payment
    const creditCards = cards.filter((card) => card.type === 'credit');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Transaction" />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">New Transaction</h1>
                    <p className="text-muted-foreground">
                        Record a new financial transaction
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <CardUI>
                        <CardHeader>
                            <CardTitle>Transaction Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Transaction Type */}
                            <div className="space-y-2">
                                <Label htmlFor="type">Transaction Type *</Label>
                                <Select
                                    value={type}
                                    onValueChange={(value: TransactionType) =>
                                        setType(value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="expense">
                                            Expense
                                        </SelectItem>
                                        <SelectItem value="income">
                                            Income
                                        </SelectItem>
                                        <SelectItem value="transfer">
                                            Transfer
                                        </SelectItem>
                                        <SelectItem value="card_payment">
                                            Card Payment
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && (
                                    <p className="text-sm text-red-500">
                                        {errors.type}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Amount */}
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount *</Label>
                                    <AmountInput
                                        name="amount"
                                        value={parseFloat(amount) || 0}
                                        onChange={(value) =>
                                            setAmount(value.toString())
                                        }
                                        currency={currency}
                                        required
                                    />
                                    {errors.amount && (
                                        <p className="text-sm text-red-500">
                                            {errors.amount}
                                        </p>
                                    )}
                                </div>

                                {/* Currency */}
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency *</Label>
                                    <Select
                                        value={currency}
                                        onValueChange={setCurrency}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CHF">
                                                CHF (Fr)
                                            </SelectItem>
                                            <SelectItem value="EUR">
                                                EUR (€)
                                            </SelectItem>
                                            <SelectItem value="USD">
                                                USD ($)
                                            </SelectItem>
                                            <SelectItem value="GBP">
                                                GBP (£)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.currency && (
                                        <p className="text-sm text-red-500">
                                            {errors.currency}
                                        </p>
                                    )}
                                </div>

                                {/* Title */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                        placeholder="e.g., Grocery shopping"
                                        required
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-500">
                                            {errors.title}
                                        </p>
                                    )}
                                </div>

                                {/* Transaction Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="transaction_date">
                                        Date *
                                    </Label>
                                    <Input
                                        id="transaction_date"
                                        type="date"
                                        value={transactionDate}
                                        onChange={(e) =>
                                            setTransactionDate(e.target.value)
                                        }
                                        required
                                    />
                                    {errors.transaction_date && (
                                        <p className="text-sm text-red-500">
                                            {errors.transaction_date}
                                        </p>
                                    )}
                                </div>

                                {/* Conditional fields based on transaction type */}
                                {type === 'expense' && (
                                    <>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="payment_method">
                                                Payment Method *
                                            </Label>
                                            <Select
                                                value={paymentMethod}
                                                onValueChange={(
                                                    value: 'account' | 'card',
                                                ) => setPaymentMethod(value)}
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
                                                    onValueChange={
                                                        setFromAccountId
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select account" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {accounts.map(
                                                            (account) => (
                                                                <SelectItem
                                                                    key={
                                                                        account.id
                                                                    }
                                                                    value={account.id.toString()}
                                                                >
                                                                    {
                                                                        account.name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
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
                                                    onValueChange={
                                                        setFromCardId
                                                    }
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
                                                                {
                                                                    card.card_holder_name
                                                                }
                                                                {card.card_number
                                                                    ? ` - •••• ${card.card_number.slice(-4)}`
                                                                    : ''}
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
                                            <Label htmlFor="category">
                                                Category
                                            </Label>
                                            <CategorySelect
                                                value={categoryId}
                                                onValueChange={setCategoryId}
                                                categories={categories}
                                                type="expense"
                                                error={errors.category_id}
                                                onCategoryCreated={
                                                    handleCategoryCreated
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="merchant">
                                                Merchant
                                            </Label>
                                            <MerchantSelect
                                                value={merchantId}
                                                onValueChange={setMerchantId}
                                                merchants={merchants}
                                                error={errors.merchant_id}
                                                onMerchantCreated={
                                                    handleMerchantCreated
                                                }
                                            />
                                        </div>

                                        {/* Budget Indicator */}
                                        <div className="md:col-span-2">
                                            <BudgetIndicator
                                                categoryId={
                                                    categoryId
                                                        ? parseInt(categoryId)
                                                        : null
                                                }
                                                transactionAmount={
                                                    parseFloat(amount) || 0
                                                }
                                                transactionType={type}
                                                currency={currency}
                                            />
                                        </div>
                                    </>
                                )}

                                {type === 'income' && (
                                    <>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="payment_method">
                                                Deposit To *
                                            </Label>
                                            <Select
                                                value={paymentMethod}
                                                onValueChange={(
                                                    value: 'account' | 'card',
                                                ) => setPaymentMethod(value)}
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
                                                    onValueChange={
                                                        setToAccountId
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select account" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {accounts.map(
                                                            (account) => (
                                                                <SelectItem
                                                                    key={
                                                                        account.id
                                                                    }
                                                                    value={account.id.toString()}
                                                                >
                                                                    {
                                                                        account.name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
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
                                                                {
                                                                    card.card_holder_name
                                                                }
                                                                {card.card_number
                                                                    ? ` - •••• ${card.card_number.slice(-4)}`
                                                                    : ''}
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
                                            <Label htmlFor="category">
                                                Category
                                            </Label>
                                            <CategorySelect
                                                value={categoryId}
                                                onValueChange={setCategoryId}
                                                categories={categories}
                                                type="income"
                                                error={errors.category_id}
                                                onCategoryCreated={
                                                    handleCategoryCreated
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="merchant">
                                                Merchant
                                            </Label>
                                            <MerchantSelect
                                                value={merchantId}
                                                onValueChange={setMerchantId}
                                                merchants={merchants}
                                                error={errors.merchant_id}
                                                onMerchantCreated={
                                                    handleMerchantCreated
                                                }
                                            />
                                        </div>
                                    </>
                                )}

                                {type === 'transfer' && (
                                    <>
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
                                                            {account.name}
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
                                                    {accounts
                                                        .filter(
                                                            (account) =>
                                                                account.id.toString() !==
                                                                fromAccountId,
                                                        )
                                                        .map((account) => (
                                                            <SelectItem
                                                                key={account.id}
                                                                value={account.id.toString()}
                                                            >
                                                                {account.name}
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

                                {type === 'card_payment' && (
                                    <>
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
                                                            {account.name}
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
                                            <Label htmlFor="to_card">
                                                Credit Card *
                                            </Label>
                                            <Select
                                                value={toCardId}
                                                onValueChange={setToCardId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select card" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {creditCards.map((card) => (
                                                        <SelectItem
                                                            key={card.id}
                                                            value={card.id.toString()}
                                                        >
                                                            {
                                                                card.card_holder_name
                                                            }
                                                            {card.card_number
                                                                ? ` - ${card.card_number.replace(/(\d{4})/g, '$1 ').trim()}`
                                                                : ''}
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
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Description (Optional)
                                </Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Add additional details..."
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">
                                        {errors.description}
                                    </p>
                                )}
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
                            {isSubmitting
                                ? 'Creating...'
                                : 'Create Transaction'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
