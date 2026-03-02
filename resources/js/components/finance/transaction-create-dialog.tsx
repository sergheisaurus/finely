import { AmountInput } from '@/components/finance/amount-input';
import { BudgetIndicator } from '@/components/finance/budget-indicator';
import { CategorySelect } from '@/components/finance/category-select';
import { MerchantSelect } from '@/components/finance/merchant-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import type { BankAccount, Card, Category, Merchant } from '@/types/finance';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type TransactionType = 'income' | 'expense' | 'transfer' | 'card_payment';

type ValidationErrors = Record<string, string>;

type ResourceCollection<T> = { data: T[] };

interface TransactionCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void | Promise<void>;
    initialAccounts?: BankAccount[];
    initialCards?: Card[];
    initialCategories?: Category[];
    initialMerchants?: Merchant[];
}

export function TransactionCreateDialog({
    open,
    onOpenChange,
    onCreated,
    initialAccounts,
    initialCards,
    initialCategories,
    initialMerchants,
}: TransactionCreateDialogProps) {
    const [accounts, setAccounts] = useState<BankAccount[]>(
        initialAccounts ?? [],
    );
    const [cards, setCards] = useState<Card[]>(initialCards ?? []);
    const [categories, setCategories] = useState<Category[]>(
        initialCategories ?? [],
    );
    const [merchants, setMerchants] = useState<Merchant[]>(
        initialMerchants ?? [],
    );

    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

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

    const creditCards = useMemo(
        () => cards.filter((card) => card.type === 'credit'),
        [cards],
    );

    const loadListsIfNeeded = async () => {
        const needsAccounts = accounts.length === 0;
        const needsCards = cards.length === 0;
        const needsCategories = categories.length === 0;
        const needsMerchants = merchants.length === 0;

        if (
            !needsAccounts &&
            !needsCards &&
            !needsCategories &&
            !needsMerchants
        ) {
            return;
        }

        setIsLoadingData(true);
        try {
            const [accRes, cardRes, catRes, merRes] = await Promise.all([
                needsAccounts
                    ? api.get<ResourceCollection<BankAccount>>('/accounts')
                    : Promise.resolve(null),
                needsCards
                    ? api.get<ResourceCollection<Card>>('/cards')
                    : Promise.resolve(null),
                needsCategories
                    ? api.get<ResourceCollection<Category>>('/categories', {
                          params: { flat: true },
                      })
                    : Promise.resolve(null),
                needsMerchants
                    ? api.get<ResourceCollection<Merchant>>('/merchants')
                    : Promise.resolve(null),
            ]);

            if (accRes) setAccounts(accRes.data.data);
            if (cardRes) setCards(cardRes.data.data);
            if (catRes) setCategories(catRes.data.data);
            if (merRes) setMerchants(merRes.data.data);
        } catch (e) {
            console.error('Failed to load transaction dialog lists:', e);
            toast.error('Failed to load transaction form data', {
                description: 'Please try again.',
            });
        } finally {
            setIsLoadingData(false);
        }
    };

    const resetForm = () => {
        setType('expense');
        setAmount('0');
        setCurrency(accounts[0]?.currency || 'CHF');
        setTitle('');
        setDescription('');
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setFromAccountId('');
        setFromCardId('');
        setToAccountId('');
        setToCardId('');
        setCategoryId('');
        setMerchantId('');
        setPaymentMethod('account');
        setErrors({});
        setIsSubmitting(false);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            resetForm();
        }
        onOpenChange(nextOpen);
    };

    // When dialog opens, ensure the supporting lists are available.
    useEffect(() => {
        if (open) {
            void loadListsIfNeeded();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Keep currency in sync with accounts when available.
    useEffect(() => {
        if (!open) return;
        if (accounts.length === 0) return;

        setCurrency((prev) => {
            if (prev !== 'CHF') return prev;
            return accounts[0]?.currency || prev;
        });
    }, [accounts, open]);

    // Smart resets based on type.
    useEffect(() => {
        setFromCardId('');
        setToCardId('');
        setCategoryId('');
        setPaymentMethod('account');
        setErrors({});

        const defaultAccount = accounts.find((acc) => acc.is_default);
        const defaultId = defaultAccount ? defaultAccount.id.toString() : '';

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
    }, [type, accounts]);

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

            toast.success('Transaction created', {
                description: title ? `${title} has been recorded.` : undefined,
            });

            if (onCreated) {
                await onCreated();
            }

            handleOpenChange(false);
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string> } };
            };

            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                console.error('Failed to create transaction:', error);
                toast.error('Failed to create transaction');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[85svh] overflow-y-auto border-slate-300/70 bg-white/85 p-0 shadow-xl backdrop-blur-sm sm:max-w-3xl dark:border-slate-700/80 dark:bg-slate-900/80">
                <div className="border-b border-slate-200/80 px-6 py-5 dark:border-slate-700/80">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-slate-100">
                            New transaction
                        </DialogTitle>
                        <DialogDescription>
                            Record an expense, income, transfer, or card
                            payment.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6">
                    {isLoadingData ? (
                        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                            <Spinner />
                            Loading form data...
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="type">
                                        Transaction Type *
                                    </Label>
                                    <Select
                                        value={type}
                                        onValueChange={(
                                            value: TransactionType,
                                        ) => setType(value)}
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

                                    <div className="space-y-2">
                                        <Label htmlFor="currency">
                                            Currency *
                                        </Label>
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
                                                    EUR (euro)
                                                </SelectItem>
                                                <SelectItem value="USD">
                                                    USD ($)
                                                </SelectItem>
                                                <SelectItem value="GBP">
                                                    GBP (pound)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.currency && (
                                            <p className="text-sm text-red-500">
                                                {errors.currency}
                                            </p>
                                        )}
                                    </div>

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

                                    <div className="space-y-2">
                                        <Label htmlFor="transaction_date">
                                            Date *
                                        </Label>
                                        <Input
                                            id="transaction_date"
                                            type="date"
                                            value={transactionDate}
                                            onChange={(e) =>
                                                setTransactionDate(
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        {errors.transaction_date && (
                                            <p className="text-sm text-red-500">
                                                {errors.transaction_date}
                                            </p>
                                        )}
                                    </div>

                                    {type === 'expense' && (
                                        <>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="payment_method">
                                                    Payment Method *
                                                </Label>
                                                <Select
                                                    value={paymentMethod}
                                                    onValueChange={(
                                                        value:
                                                            | 'account'
                                                            | 'card',
                                                    ) =>
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
                                                            {
                                                                errors.from_account_id
                                                            }
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
                                                            {cards.map(
                                                                (card) => (
                                                                    <SelectItem
                                                                        key={
                                                                            card.id
                                                                        }
                                                                        value={card.id.toString()}
                                                                    >
                                                                        {
                                                                            card.card_holder_name
                                                                        }
                                                                        {card.card_number
                                                                            ? ` - •••• ${card.card_number.slice(-4)}`
                                                                            : ''}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.from_card_id && (
                                                        <p className="text-sm text-red-500">
                                                            {
                                                                errors.from_card_id
                                                            }
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
                                                    onValueChange={
                                                        setCategoryId
                                                    }
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
                                                    onValueChange={
                                                        setMerchantId
                                                    }
                                                    merchants={merchants}
                                                    error={errors.merchant_id}
                                                    onMerchantCreated={
                                                        handleMerchantCreated
                                                    }
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <BudgetIndicator
                                                    categoryId={
                                                        categoryId
                                                            ? parseInt(
                                                                  categoryId,
                                                              )
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
                                                        value:
                                                            | 'account'
                                                            | 'card',
                                                    ) =>
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
                                                            (Cashback/Refund)
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
                                                            {
                                                                errors.to_account_id
                                                            }
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
                                                        onValueChange={
                                                            setToCardId
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select card" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {cards.map(
                                                                (card) => (
                                                                    <SelectItem
                                                                        key={
                                                                            card.id
                                                                        }
                                                                        value={card.id.toString()}
                                                                    >
                                                                        {
                                                                            card.card_holder_name
                                                                        }
                                                                        {card.card_number
                                                                            ? ` - •••• ${card.card_number.slice(-4)}`
                                                                            : ''}
                                                                    </SelectItem>
                                                                ),
                                                            )}
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
                                                    onValueChange={
                                                        setCategoryId
                                                    }
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
                                                    onValueChange={
                                                        setMerchantId
                                                    }
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
                                                        {accounts
                                                            .filter(
                                                                (account) =>
                                                                    account.id.toString() !==
                                                                    fromAccountId,
                                                            )
                                                            .map((account) => (
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
                                                        {creditCards.map(
                                                            (card) => (
                                                                <SelectItem
                                                                    key={
                                                                        card.id
                                                                    }
                                                                    value={card.id.toString()}
                                                                >
                                                                    {
                                                                        card.card_holder_name
                                                                    }
                                                                    {card.card_number
                                                                        ? ` - ${card.card_number.replace(/(\d{4})/g, '$1 ').trim()}`
                                                                        : ''}
                                                                </SelectItem>
                                                            ),
                                                        )}
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
                            </div>

                            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Spinner />
                                            Creating...
                                        </span>
                                    ) : (
                                        'Create Transaction'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
