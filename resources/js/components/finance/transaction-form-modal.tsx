import { AmountInput } from '@/components/finance/amount-input';
import { BudgetIndicator } from '@/components/finance/budget-indicator';
import { QuickCreateCategoryModal } from '@/components/finance/quick-create-category-modal';
import { QuickCreateMerchantModal } from '@/components/finance/quick-create-merchant-modal';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
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
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { useSecretStore } from '@/stores/useSecretStore';
import type { BankAccount, Card, Category, Merchant, Transaction } from '@/types/finance';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type TransactionType = 'income' | 'expense' | 'transfer' | 'card_payment';

interface TransactionFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** When provided, the modal operates in edit mode */
    transaction?: Transaction | null;
    /** Called after a successful create/edit with the saved transaction */
    onSuccess?: () => void;
    defaultType?: TransactionType;
}

export function TransactionFormModal({
    open,
    onOpenChange,
    transaction,
    onSuccess,
    defaultType = 'expense',
}: TransactionFormModalProps) {
    const isEditMode = !!transaction;

    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { isSecretModeActive } = useSecretStore();

    // Form state
    const [type, setType] = useState<TransactionType>(defaultType);
    const [amount, setAmount] = useState('0');
    const [currency, setCurrency] = useState('CHF');
    const [title, setTitle] = useState('');
    const [secretTitle, setSecretTitle] = useState('');
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

    // Sub-modal state
    const [showCreateCategory, setShowCreateCategory] = useState(false);
    const [showCreateMerchant, setShowCreateMerchant] = useState(false);

    // Load reference data when modal opens
    useEffect(() => {
        if (!open) return;
        setIsLoadingData(true);

        const fetchAll = async () => {
            try {
                const [accRes, cardRes, catRes, merRes] = await Promise.all([
                    api.get('/accounts'),
                    api.get('/cards'),
                    api.get('/categories?flat=1'),
                    api.get('/merchants'),
                ]);
                const accs: BankAccount[] = accRes.data.data;
                setAccounts(accs);
                setCards(cardRes.data.data);
                setCategories(catRes.data.data);
                setMerchants(merRes.data.data);

                // In create mode, pre-fill the default account
                if (!isEditMode) {
                    const def = accs.find((a) => a.is_default);
                    if (def && defaultType === 'expense') setFromAccountId(def.id.toString());
                    else if (def && defaultType === 'income') setToAccountId(def.id.toString());
                }
            } catch {
                toast.error('Failed to load form data');
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Populate form from transaction in edit mode
    useEffect(() => {
        if (!open || !transaction) return;

        setType(transaction.type);
        setAmount(parseFloat(String(transaction.amount ?? 0)).toFixed(2));
        setCurrency(transaction.currency);
        setTitle(transaction.title);
        setSecretTitle(transaction.secret_title ?? '');
        setDescription(transaction.description ?? '');
        setTransactionDate(transaction.transaction_date);
        setFromAccountId(transaction.from_account_id?.toString() ?? '');
        setFromCardId(transaction.from_card_id?.toString() ?? '');
        setToAccountId(transaction.to_account_id?.toString() ?? '');
        setToCardId(transaction.to_card_id?.toString() ?? '');

        if (isSecretModeActive && transaction.is_secret) {
            setCategoryId(transaction.secret_category_id?.toString() ?? transaction.category_id?.toString() ?? '');
            setMerchantId(transaction.secret_merchant_id?.toString() ?? transaction.merchant_id?.toString() ?? '');
        } else {
            setCategoryId(transaction.category_id?.toString() ?? '');
            setMerchantId(transaction.merchant_id?.toString() ?? '');
        }

        if (transaction.type === 'expense' || transaction.type === 'income') {
            setPaymentMethod(
                transaction.from_card_id || transaction.to_card_id ? 'card' : 'account',
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, transaction]);

    // Reset when modal closes
    const handleOpenChange = (v: boolean) => {
        if (!v) {
            setErrors({});
            if (!isEditMode) {
                setType(defaultType);
                setAmount('0');
                setCurrency('CHF');
                setTitle('');
                setSecretTitle('');
                setDescription('');
                setTransactionDate(new Date().toISOString().split('T')[0]);
                setFromAccountId('');
                setFromCardId('');
                setToAccountId('');
                setToCardId('');
                setCategoryId('');
                setMerchantId('');
                setPaymentMethod('account');
            }
        }
        onOpenChange(v);
    };

    // Reset account/card when payment method changes
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentMethod]);

    const buildPayload = () => {
        const payload: Record<string, unknown> = {
            type,
            amount: parseFloat(amount) || 0,
            currency,
            title,
            description: description || undefined,
            transaction_date: transactionDate,
            secret_title: secretTitle || undefined,
        };

        if (type === 'expense') {
            payload.from_account_id = fromAccountId ? parseInt(fromAccountId) : null;
            payload.from_card_id = fromCardId ? parseInt(fromCardId) : null;
            payload.category_id = categoryId ? parseInt(categoryId) : null;
            payload.merchant_id = merchantId ? parseInt(merchantId) : null;
        } else if (type === 'income') {
            payload.to_account_id = toAccountId ? parseInt(toAccountId) : null;
            payload.to_card_id = toCardId ? parseInt(toCardId) : null;
            payload.category_id = categoryId ? parseInt(categoryId) : null;
            payload.merchant_id = merchantId ? parseInt(merchantId) : null;
        } else if (type === 'transfer') {
            payload.from_account_id = fromAccountId ? parseInt(fromAccountId) : null;
            payload.to_account_id = toAccountId ? parseInt(toAccountId) : null;
        } else if (type === 'card_payment') {
            payload.from_account_id = fromAccountId ? parseInt(fromAccountId) : null;
            payload.to_card_id = toCardId ? parseInt(toCardId) : null;
        }

        return payload;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});
        try {
            if (isEditMode && transaction) {
                await api.put(`/transactions/${transaction.id}`, buildPayload());
                toast.success('Transaction updated!', { description: title });
            } else {
                await api.post('/transactions', buildPayload());
                toast.success('Transaction created!', { description: title });
            }
            onSuccess?.();
            handleOpenChange(false);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { errors?: Record<string, string> } } };
            if (e.response?.data?.errors) {
                setErrors(e.response.data.errors);
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtered lists
    const filteredCategories = categories.filter((c) => {
        if (!isSecretModeActive && c.is_secret) return false;
        if (type === 'income') return c.type === 'income';
        if (type === 'expense') return c.type === 'expense';
        return false;
    });
    const visibleMerchants = merchants.filter(
        (m) => isSecretModeActive || !m.is_secret,
    );
    const creditCards = cards.filter((c) => c.type === 'credit');

    const modalTitle = isEditMode
        ? isSecretModeActive
            ? 'Edit Your Dirty Little Secret 🔒'
            : 'Edit Transaction'
        : isSecretModeActive
            ? 'New Slutty Expense 🔒'
            : 'New Transaction';

    // Helper: Category select field with "+ Create new" button
    const CategorySelectField = () => (
        <div className="space-y-1">
            <Label>Category</Label>
            <div className="flex gap-2">
                <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredCategories.length === 0 && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No categories</div>
                        )}
                        {filteredCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                                {c.parent && '└ '}
                                {c.icon} {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCreateCategory(true)}
                    title="Create new category"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
        </div>
    );

    // Helper: Merchant select field with "+ Create new" button
    const MerchantSelectField = () => (
        <div className="space-y-1">
            <Label>Merchant</Label>
            <div className="flex gap-2">
                <Select value={merchantId} onValueChange={setMerchantId}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select merchant" />
                    </SelectTrigger>
                    <SelectContent>
                        {visibleMerchants.length === 0 && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No merchants</div>
                        )}
                        {visibleMerchants.map((m) => (
                            <SelectItem key={m.id} value={m.id.toString()}>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCreateMerchant(true)}
                    title="Create new merchant"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            {errors.merchant_id && <p className="text-sm text-red-500">{errors.merchant_id}</p>}
        </div>
    );

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{modalTitle}</DialogTitle>
                    </DialogHeader>

                    {isLoadingData ? (
                        <div className="space-y-3 py-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-9 animate-pulse rounded bg-muted" />
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5 py-2">
                            {/* Row 1: Type + Date */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="tfm-type">Transaction Type *</Label>
                                    <Select
                                        value={type}
                                        onValueChange={(v: TransactionType) => {
                                            setType(v);
                                            setFromAccountId('');
                                            setFromCardId('');
                                            setToAccountId('');
                                            setToCardId('');
                                            setCategoryId('');
                                            setPaymentMethod('account');
                                            setErrors({});
                                        }}
                                    >
                                        <SelectTrigger id="tfm-type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expense">Expense</SelectItem>
                                            <SelectItem value="income">Income</SelectItem>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                            <SelectItem value="card_payment">Card Payment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="tfm-date">Date *</Label>
                                    <Input
                                        id="tfm-date"
                                        type="date"
                                        value={transactionDate}
                                        onChange={(e) => setTransactionDate(e.target.value)}
                                        required
                                    />
                                    {errors.transaction_date && (
                                        <p className="text-sm text-red-500">{errors.transaction_date}</p>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Amount + Currency */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="tfm-amount">Amount *</Label>
                                    <AmountInput
                                        name="amount"
                                        value={parseFloat(amount) || 0}
                                        onChange={(v) => setAmount(v.toString())}
                                        currency={currency}
                                        required
                                    />
                                    {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="tfm-currency">Currency *</Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger id="tfm-currency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CHF">CHF (Fr)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-1">
                                <Label htmlFor="tfm-title">Title *</Label>
                                <Input
                                    id="tfm-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Grocery shopping"
                                    required
                                    maxLength={255}
                                />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>

                            {/* Secret Title */}
                            {isSecretModeActive && (
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="tfm-secret-title"
                                        className="text-fuchsia-500 dark:text-fuchsia-400"
                                    >
                                        🔒 Secret Title
                                    </Label>
                                    <Input
                                        id="tfm-secret-title"
                                        value={secretTitle}
                                        onChange={(e) => setSecretTitle(e.target.value)}
                                        placeholder="Only visible in Secret Mode"
                                        className="border-fuchsia-500/50 focus-visible:ring-fuchsia-500/50"
                                        maxLength={255}
                                    />
                                </div>
                            )}

                            {/* ── Expense fields ── */}
                            {type === 'expense' && (
                                <>
                                    <div className="space-y-1">
                                        <Label>Payment Method *</Label>
                                        <Select
                                            value={paymentMethod}
                                            onValueChange={(v: 'account' | 'card') =>
                                                setPaymentMethod(v)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="account">Bank Account</SelectItem>
                                                <SelectItem value="card">Card</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {paymentMethod === 'account' ? (
                                        <div className="space-y-1">
                                            <Label>From Account *</Label>
                                            <Select value={fromAccountId} onValueChange={setFromAccountId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.map((a) => (
                                                        <SelectItem key={a.id} value={a.id.toString()}>
                                                            {a.name} ({a.currency} {a.balance.toFixed(2)})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.from_account_id && (
                                                <p className="text-sm text-red-500">{errors.from_account_id}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <Label>From Card *</Label>
                                            <Select value={fromCardId} onValueChange={setFromCardId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select card" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cards.map((c) => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>
                                                            {c.card_holder_name}
                                                            {c.card_number
                                                                ? ` - •••• ${c.card_number.slice(-4)}`
                                                                : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.from_card_id && (
                                                <p className="text-sm text-red-500">{errors.from_card_id}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <CategorySelectField />
                                        <MerchantSelectField />
                                    </div>

                                    <BudgetIndicator
                                        categoryId={categoryId ? parseInt(categoryId) : null}
                                        transactionAmount={parseFloat(amount) || 0}
                                        transactionType={type}
                                        currency={currency}
                                    />
                                </>
                            )}

                            {/* ── Income fields ── */}
                            {type === 'income' && (
                                <>
                                    <div className="space-y-1">
                                        <Label>Deposit To *</Label>
                                        <Select
                                            value={paymentMethod}
                                            onValueChange={(v: 'account' | 'card') =>
                                                setPaymentMethod(v)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="account">Bank Account</SelectItem>
                                                <SelectItem value="card">Card (Cashback/Refund)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {paymentMethod === 'account' ? (
                                        <div className="space-y-1">
                                            <Label>To Account *</Label>
                                            <Select value={toAccountId} onValueChange={setToAccountId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.map((a) => (
                                                        <SelectItem key={a.id} value={a.id.toString()}>
                                                            {a.name} ({a.currency} {a.balance.toFixed(2)})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.to_account_id && (
                                                <p className="text-sm text-red-500">{errors.to_account_id}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <Label>To Card *</Label>
                                            <Select value={toCardId} onValueChange={setToCardId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select card" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cards.map((c) => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>
                                                            {c.card_holder_name}
                                                            {c.card_number
                                                                ? ` - •••• ${c.card_number.slice(-4)}`
                                                                : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.to_card_id && (
                                                <p className="text-sm text-red-500">{errors.to_card_id}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <CategorySelectField />
                                        <MerchantSelectField />
                                    </div>
                                </>
                            )}

                            {/* ── Transfer fields ── */}
                            {type === 'transfer' && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label>From Account *</Label>
                                        <Select value={fromAccountId} onValueChange={setFromAccountId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts.map((a) => (
                                                    <SelectItem key={a.id} value={a.id.toString()}>
                                                        {a.name} ({a.currency} {a.balance.toFixed(2)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.from_account_id && (
                                            <p className="text-sm text-red-500">{errors.from_account_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label>To Account *</Label>
                                        <Select value={toAccountId} onValueChange={setToAccountId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts
                                                    .filter((a) => a.id.toString() !== fromAccountId)
                                                    .map((a) => (
                                                        <SelectItem key={a.id} value={a.id.toString()}>
                                                            {a.name} ({a.currency} {a.balance.toFixed(2)})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.to_account_id && (
                                            <p className="text-sm text-red-500">{errors.to_account_id}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Card Payment fields ── */}
                            {type === 'card_payment' && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label>From Account *</Label>
                                        <Select value={fromAccountId} onValueChange={setFromAccountId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts.map((a) => (
                                                    <SelectItem key={a.id} value={a.id.toString()}>
                                                        {a.name} ({a.currency} {a.balance.toFixed(2)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.from_account_id && (
                                            <p className="text-sm text-red-500">{errors.from_account_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label>Credit Card *</Label>
                                        <Select value={toCardId} onValueChange={setToCardId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select card" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {creditCards.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.card_holder_name}
                                                        {c.card_number
                                                            ? ` - •••• ${c.card_number.slice(-4)}`
                                                            : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.to_card_id && (
                                            <p className="text-sm text-red-500">{errors.to_card_id}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-1">
                                <Label htmlFor="tfm-desc">Description</Label>
                                <Textarea
                                    id="tfm-desc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional notes…"
                                    rows={2}
                                />
                            </div>

                            {/* Footer buttons */}
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                >
                                    {isSubmitting
                                        ? isEditMode
                                            ? 'Saving…'
                                            : 'Creating…'
                                        : isEditMode
                                            ? 'Save Changes'
                                            : 'Create Transaction'}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Nested sub-modals */}
            <QuickCreateCategoryModal
                open={showCreateCategory}
                onOpenChange={setShowCreateCategory}
                defaultType={type === 'income' ? 'income' : 'expense'}
                existingCategories={categories}
                onCreated={(cat) => {
                    setCategories((prev) => [...prev, cat]);
                    setCategoryId(cat.id.toString());
                }}
            />

            <QuickCreateMerchantModal
                open={showCreateMerchant}
                onOpenChange={setShowCreateMerchant}
                onCreated={(merchant) => {
                    setMerchants((prev) => [...prev, merchant]);
                    setMerchantId(merchant.id.toString());
                }}
            />
        </>
    );
}
