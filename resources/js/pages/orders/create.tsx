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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type {
    BankAccount,
    Card,
    Category,
    Merchant,
    OrderItem,
} from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { Minus, Plus, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Orders', href: '/orders' },
    { title: 'Create', href: '/orders/create' },
];

type DraftItem = Omit<
    OrderItem,
    'id' | 'order_id' | 'created_at' | 'updated_at'
>;

const orderStatuses = [
    { value: 'placed', label: 'Placed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'returned', label: 'Returned' },
    { value: 'partial', label: 'Partial' },
] as const;

export default function OrderCreate() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [cards, setCards] = useState<Card[]>([]);

    const [provider, setProvider] = useState('amazon');
    const [orderSite, setOrderSite] = useState('amazon.it');
    const [orderNumber, setOrderNumber] = useState('');
    const [orderUrl, setOrderUrl] = useState('');
    const [orderedAt, setOrderedAt] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [deliveredAt, setDeliveredAt] = useState('');
    const [status, setStatus] =
        useState<(typeof orderStatuses)[number]['value']>('placed');
    const [merchantId, setMerchantId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [currency, setCurrency] = useState('CHF');
    const [amount, setAmount] = useState('');
    const [sourceCurrency, setSourceCurrency] = useState('EUR');
    const [fxRate, setFxRate] = useState('');
    const [notes, setNotes] = useState('');

    const [createTransaction, setCreateTransaction] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>(
        'account',
    );
    const [fromAccountId, setFromAccountId] = useState('');
    const [fromCardId, setFromCardId] = useState('');

    const [items, setItems] = useState<DraftItem[]>([
        {
            name: '',
            quantity: 1,
            unit_price: null,
            amount: null,
            product_url: null,
            external_item_id: null,
            ordered_at: null,
            delivered_at: null,
            returned_at: null,
            status: 'ordered',
            sort_order: 0,
        },
    ]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [merchantsRes, categoriesRes, accountsRes, cardsRes] =
                await Promise.all([
                    api.get('/merchants'),
                    api.get('/categories'),
                    api.get('/accounts'),
                    api.get('/cards'),
                ]);
            setMerchants(merchantsRes.data.data || []);
            setCategories(
                (categoriesRes.data.data || []).filter(
                    (c: Category) => c.type === 'expense',
                ),
            );
            setAccounts(accountsRes.data.data || []);
            setCards(cardsRes.data.data || []);

            const defaultAccount = (accountsRes.data.data || []).find(
                (a: BankAccount) => a.is_default,
            );
            if (defaultAccount) setFromAccountId(String(defaultAccount.id));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const computedItemsTotal = useMemo(() => {
        const total = items.reduce((sum, item) => {
            const qty = Number(item.quantity || 1);
            const unit =
                item.unit_price === null ? null : Number(item.unit_price);
            const line = item.amount === null ? null : Number(item.amount);

            if (!Number.isNaN(line) && line !== null) return sum + line;
            if (!Number.isNaN(unit ?? NaN) && unit !== null)
                return sum + qty * unit;
            return sum;
        }, 0);

        return Number.isFinite(total) ? total : 0;
    }, [items]);

    const computedItemsTotalCharged = useMemo(() => {
        const rate = Number(fxRate);
        if (Number.isFinite(rate) && rate > 0) {
            return computedItemsTotal * rate;
        }
        return computedItemsTotal;
    }, [computedItemsTotal, fxRate]);

    const computedFees = useMemo(() => {
        const charged = Number(amount);
        if (!Number.isFinite(charged)) return null;
        return charged - computedItemsTotalCharged;
    }, [amount, computedItemsTotalCharged]);

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

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                name: '',
                quantity: 1,
                unit_price: null,
                amount: null,
                product_url: null,
                external_item_id: null,
                ordered_at: null,
                delivered_at: null,
                returned_at: null,
                status: 'ordered',
                sort_order: prev.length,
            },
        ]);
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, patch: Partial<DraftItem>) => {
        setItems((prev) =>
            prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
        );
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setErrors({});

        const cleanItems = items
            .map((it, idx) => ({ ...it, sort_order: idx }))
            .filter((it) => it.name.trim().length > 0);

        try {
            const fxRateNumber = Number(fxRate);
            const hasFx = Number.isFinite(fxRateNumber) && fxRateNumber > 0;

            const payload = {
                provider: provider.trim() || null,
                order_site: orderSite.trim() || null,
                order_number: orderNumber.trim() || null,
                order_url: orderUrl.trim() || null,
                ordered_at: orderedAt,
                delivered_at: deliveredAt || null,
                status,
                merchant_id: merchantId ? Number(merchantId) : null,
                category_id: categoryId ? Number(categoryId) : null,
                amount: Number(amount || computedItemsTotalCharged || 0),
                currency,
                source_currency: hasFx
                    ? sourceCurrency.trim().toUpperCase()
                    : null,
                fx_rate: hasFx ? fxRateNumber : null,
                fx_fee_amount:
                    computedFees !== null && Number.isFinite(computedFees)
                        ? Number(computedFees.toFixed(2))
                        : null,
                notes: notes.trim() || null,
                items: cleanItems,
                create_transaction: createTransaction,
                transaction: createTransaction
                    ? {
                          from_account_id:
                              paymentMethod === 'account' && fromAccountId
                                  ? Number(fromAccountId)
                                  : null,
                          from_card_id:
                              paymentMethod === 'card' && fromCardId
                                  ? Number(fromCardId)
                                  : null,
                      }
                    : null,
            };

            const res = await api.post('/orders', payload);
            toast.success('Order created');
            router.visit(`/orders/${res.data.data.id}`);
        } catch (error: any) {
            console.error('Failed to create order:', error);
            if (error?.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            }
            toast.error('Failed to create order');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Order" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Create Order</h1>
                        <p className="text-muted-foreground">
                            Add an order and optionally create the matching
                            transaction
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <CardUI>
                            <CardHeader>
                                <CardTitle>Order Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Provider</Label>
                                        <Input
                                            value={provider}
                                            onChange={(e) =>
                                                setProvider(e.target.value)
                                            }
                                            placeholder="amazon"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Marketplace</Label>
                                        <Input
                                            value={orderSite}
                                            onChange={(e) =>
                                                setOrderSite(e.target.value)
                                            }
                                            placeholder="amazon.it"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Order Number</Label>
                                        <Input
                                            value={orderNumber}
                                            onChange={(e) =>
                                                setOrderNumber(e.target.value)
                                            }
                                            placeholder="e.g. 123-1234567-1234567"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Order URL</Label>
                                    <Input
                                        value={orderUrl}
                                        onChange={(e) =>
                                            setOrderUrl(e.target.value)
                                        }
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Ordered Date</Label>
                                        <Input
                                            type="date"
                                            value={orderedAt}
                                            onChange={(e) =>
                                                setOrderedAt(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Delivered Date</Label>
                                        <Input
                                            type="date"
                                            value={deliveredAt}
                                            onChange={(e) =>
                                                setDeliveredAt(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={status}
                                            onValueChange={(v) =>
                                                setStatus(v as any)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {orderStatuses.map((s) => (
                                                    <SelectItem
                                                        key={s.value}
                                                        value={s.value}
                                                    >
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Merchant</Label>
                                        <MerchantSelect
                                            merchants={merchants}
                                            value={merchantId}
                                            onValueChange={setMerchantId}
                                            onMerchantCreated={
                                                handleMerchantCreated
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <CategorySelect
                                            categories={categories}
                                            value={categoryId}
                                            onValueChange={setCategoryId}
                                            onCategoryCreated={
                                                handleCategoryCreated
                                            }
                                            type="expense"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Currency (charged)</Label>
                                        <Input
                                            value={currency}
                                            onChange={(e) =>
                                                setCurrency(e.target.value)
                                            }
                                            placeholder="CHF"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <p className="text-sm font-semibold">
                                        Exchange rate
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        If you enter item prices in EUR, set the
                                        rate here. Otherwise leave it empty.
                                    </p>

                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Item currency</Label>
                                            <Input
                                                value={sourceCurrency}
                                                onChange={(e) =>
                                                    setSourceCurrency(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="EUR"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>
                                                Rate (1{' '}
                                                {sourceCurrency || 'EUR'} = x{' '}
                                                {currency || 'CHF'})
                                            </Label>
                                            <Input
                                                value={fxRate}
                                                onChange={(e) =>
                                                    setFxRate(e.target.value)
                                                }
                                                placeholder="e.g. 0.9288148"
                                            />
                                        </div>
                                    </div>

                                    <p className="mt-3 text-xs text-muted-foreground">
                                        Items total (converted):{' '}
                                        {computedItemsTotalCharged.toFixed(2)}{' '}
                                        {currency}
                                    </p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Order Total (charged)</Label>
                                        <Input
                                            value={amount}
                                            onChange={(e) =>
                                                setAmount(e.target.value)
                                            }
                                            placeholder={String(
                                                computedItemsTotalCharged.toFixed(
                                                    2,
                                                ),
                                            )}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Items total (converted):{' '}
                                            {formatCurrency(
                                                computedItemsTotalCharged,
                                                currency,
                                            )}
                                            {computedFees !== null && (
                                                <>
                                                    {' '}
                                                    • Fees:{' '}
                                                    {formatCurrency(
                                                        computedFees,
                                                        currency,
                                                    )}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(e.target.value)
                                            }
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>

                                {Object.keys(errors).length > 0 && (
                                    <p className="text-sm text-red-500">
                                        Please fix the highlighted fields.
                                    </p>
                                )}
                            </CardContent>
                        </CardUI>

                        <CardUI>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Items</CardTitle>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={addItem}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Item
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border p-4"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="text-sm font-semibold">
                                                Item {idx + 1}
                                            </p>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={items.length === 1}
                                                onClick={() => removeItem(idx)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Name</Label>
                                                <Input
                                                    value={item.name}
                                                    onChange={(e) =>
                                                        updateItem(idx, {
                                                            name: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Item name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Product URL</Label>
                                                <Input
                                                    value={
                                                        item.product_url || ''
                                                    }
                                                    onChange={(e) =>
                                                        updateItem(idx, {
                                                            product_url:
                                                                e.target
                                                                    .value ||
                                                                null,
                                                        })
                                                    }
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label>Qty</Label>
                                                <Input
                                                    value={String(
                                                        item.quantity || 1,
                                                    )}
                                                    onChange={(e) =>
                                                        updateItem(idx, {
                                                            quantity:
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ) || 1,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>
                                                    Unit Price (
                                                    {sourceCurrency || currency}
                                                    )
                                                </Label>
                                                <Input
                                                    value={
                                                        item.unit_price === null
                                                            ? ''
                                                            : String(
                                                                  item.unit_price,
                                                              )
                                                    }
                                                    onChange={(e) =>
                                                        updateItem(idx, {
                                                            unit_price:
                                                                e.target
                                                                    .value ===
                                                                ''
                                                                    ? null
                                                                    : Number(
                                                                          e
                                                                              .target
                                                                              .value,
                                                                      ),
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                <Select
                                                    value={item.status}
                                                    onValueChange={(v) =>
                                                        updateItem(idx, {
                                                            status: v as any,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ordered">
                                                            Ordered
                                                        </SelectItem>
                                                        <SelectItem value="shipped">
                                                            Shipped
                                                        </SelectItem>
                                                        <SelectItem value="delivered">
                                                            Delivered
                                                        </SelectItem>
                                                        <SelectItem value="returned">
                                                            Returned
                                                        </SelectItem>
                                                        <SelectItem value="cancelled">
                                                            Cancelled
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </CardUI>
                    </div>

                    <div className="space-y-6">
                        <CardUI>
                            <CardHeader>
                                <CardTitle>Transaction</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">
                                            Create transaction
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Makes a matching expense entry
                                        </p>
                                    </div>
                                    <Switch
                                        checked={createTransaction}
                                        onCheckedChange={setCreateTransaction}
                                    />
                                </div>

                                {createTransaction && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Pay with</Label>
                                            <Select
                                                value={paymentMethod}
                                                onValueChange={(v) =>
                                                    setPaymentMethod(
                                                        v as typeof paymentMethod,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="account">
                                                        Bank account
                                                    </SelectItem>
                                                    <SelectItem value="card">
                                                        Card
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {paymentMethod === 'account' ? (
                                            <div className="space-y-2">
                                                <Label>From account</Label>
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
                                                        {accounts.map((a) => (
                                                            <SelectItem
                                                                key={a.id}
                                                                value={String(
                                                                    a.id,
                                                                )}
                                                            >
                                                                {a.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label>From card</Label>
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
                                                        {cards.map((c) => (
                                                            <SelectItem
                                                                key={c.id}
                                                                value={String(
                                                                    c.id,
                                                                )}
                                                            >
                                                                {
                                                                    c.card_holder_name
                                                                }{' '}
                                                                ••••{' '}
                                                                {c.card_number.slice(
                                                                    -4,
                                                                )}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-2">
                                    <Button
                                        className="w-full"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSubmitting
                                            ? 'Saving...'
                                            : 'Create Order'}
                                    </Button>
                                    <Button
                                        className="mt-2 w-full"
                                        variant="ghost"
                                        onClick={() => router.visit('/orders')}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </CardUI>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
