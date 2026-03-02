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
import { type BreadcrumbItem } from '@/types';
import type {
    Category,
    Merchant,
    Order,
    OrderItem,
    Transaction,
} from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { Minus, Plus, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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

export default function OrderEdit({ orderId }: { orderId: string }) {
    const [order, setOrder] = useState<Order | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [provider, setProvider] = useState('');
    const [orderSite, setOrderSite] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [orderUrl, setOrderUrl] = useState('');
    const [orderedAt, setOrderedAt] = useState('');
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
    const [items, setItems] = useState<DraftItem[]>([]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Orders', href: '/orders' },
        {
            title: order?.order_number ? `#${order.order_number}` : 'Edit',
            href: `/orders/${orderId}/edit`,
        },
    ];

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [orderRes, txRes, merchantsRes, categoriesRes] =
                await Promise.all([
                    api.get(`/orders/${orderId}`),
                    api.get(`/orders/${orderId}/transactions`),
                    api.get('/merchants'),
                    api.get('/categories'),
                ]);

            const o: Order = orderRes.data.data;
            setOrder(o);
            setTransactions(txRes.data.data || []);
            setMerchants(merchantsRes.data.data || []);
            setCategories(
                (categoriesRes.data.data || []).filter(
                    (c: Category) => c.type === 'expense',
                ),
            );

            setProvider(o.provider || '');
            setOrderSite(o.order_site || '');
            setOrderNumber(o.order_number || '');
            setOrderUrl(o.order_url || '');
            setOrderedAt(o.ordered_at);
            setDeliveredAt(o.delivered_at || '');
            setStatus(o.status);
            setMerchantId(o.merchant_id ? String(o.merchant_id) : '');
            setCategoryId(o.category_id ? String(o.category_id) : '');
            setCurrency(o.currency);
            setAmount(String(o.amount));
            setSourceCurrency(o.source_currency || 'EUR');
            setFxRate(
                o.fx_rate === null || o.fx_rate === undefined
                    ? ''
                    : String(o.fx_rate),
            );
            setNotes(o.notes || '');
            setItems(
                (o.items || []).map((it, idx) => ({
                    name: it.name,
                    quantity: it.quantity,
                    unit_price: it.unit_price ?? null,
                    amount: it.amount ?? null,
                    product_url: it.product_url ?? null,
                    external_item_id: it.external_item_id ?? null,
                    ordered_at: it.ordered_at ?? null,
                    delivered_at: it.delivered_at ?? null,
                    returned_at: it.returned_at ?? null,
                    status: it.status,
                    sort_order: idx,
                })),
            );
        } catch (error) {
            console.error('Failed to load order:', error);
            toast.error('Failed to load order');
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    const handleSave = async () => {
        if (!order) return;

        setIsSubmitting(true);
        try {
            const cleanItems = items
                .map((it, idx) => ({ ...it, sort_order: idx }))
                .filter((it) => it.name.trim().length > 0);

            const fxRateNumber = Number(fxRate);
            const hasFx = Number.isFinite(fxRateNumber) && fxRateNumber > 0;

            await api.put(`/orders/${order.id}`, {
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
            });
            toast.success('Order updated');
            router.visit(`/orders/${order.id}`);
        } catch (error) {
            console.error('Failed to update order:', error);
            toast.error('Failed to update order');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit Order" />
                <div className="p-6">Loading...</div>
            </AppLayout>
        );
    }

    if (!order) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit Order" />
                <div className="p-6">Order not found.</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Order" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Edit Order</h1>
                        <p className="text-muted-foreground">
                            Update details and items
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => router.visit(`/orders/${order.id}`)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
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
                                                <SelectValue />
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
                                            {computedItemsTotalCharged.toFixed(
                                                2,
                                            )}{' '}
                                            {currency}
                                            {computedFees !== null && (
                                                <>
                                                    {' '}
                                                    • Fees:{' '}
                                                    {computedFees.toFixed(
                                                        2,
                                                    )}{' '}
                                                    {currency}
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
                                        />
                                    </div>
                                </div>
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
                                {items.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No items yet.
                                    </p>
                                )}

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
                                <CardTitle>Linked Transactions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {transactions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No transactions linked.
                                    </p>
                                ) : (
                                    transactions.map((t) => (
                                        <div
                                            key={t.id}
                                            className="rounded-md border p-3"
                                        >
                                            <p className="text-sm font-medium">
                                                {t.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t.transaction_date} •{' '}
                                                {t.amount} {t.currency}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </CardUI>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
