import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import type { Order, Transaction } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Link2, Package, Pencil } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const statusStyles: Record<string, string> = {
    placed: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
    shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    delivered:
        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    returned:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    partial:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

export default function OrderView({ orderId }: { orderId: string }) {
    const [order, setOrder] = useState<Order | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [txSearch, setTxSearch] = useState('');
    const [txResults, setTxResults] = useState<Transaction[]>([]);
    const [selectedTxId, setSelectedTxId] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Orders', href: '/orders' },
        {
            title: order?.order_number ? `#${order.order_number}` : 'Order',
            href: `/orders/${orderId}`,
        },
    ];

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [orderRes, txRes] = await Promise.all([
                api.get(`/orders/${orderId}`),
                api.get(`/orders/${orderId}/transactions`),
            ]);
            setOrder(orderRes.data.data);
            setTransactions(txRes.data.data || []);
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

    useEffect(() => {
        const q = txSearch.trim();
        if (q.length < 2) {
            setTxResults([]);
            return;
        }

        let cancelled = false;

        api.get('/transactions', {
            params: {
                type: 'expense',
                search: q,
                per_page: 20,
            },
        })
            .then((res) => {
                if (cancelled) return;
                setTxResults(res.data.data || []);
            })
            .catch((error) => {
                if (cancelled) return;
                console.error('Failed to search transactions:', error);
            });

        return () => {
            cancelled = true;
        };
    }, [txSearch]);

    const linkableTxResults = useMemo(() => {
        return txResults.filter(
            (t) => !t.transactionable_id && !t.transactionable_type,
        );
    }, [txResults]);

    const computed = useMemo(() => {
        if (!order) return null;

        const orderCurrency = order.currency || 'CHF';
        const rate = Number(order.fx_rate);
        const fxRate = Number.isFinite(rate) && rate > 0 ? rate : 1;
        const baseCurrency = order.source_currency || 'EUR';

        const items = order.items || [];
        const itemsConvertedTotal = items.reduce((sum, it) => {
            const qty = Number(it.quantity || 1);
            const raw =
                it.amount !== null && it.amount !== undefined
                    ? Number(it.amount)
                    : it.unit_price !== null && it.unit_price !== undefined
                      ? Number(it.unit_price) * qty
                      : 0;

            const conversionRate =
                baseCurrency.toUpperCase() === orderCurrency.toUpperCase()
                    ? 1
                    : fxRate;

            return sum + raw * conversionRate;
        }, 0);

        const chargedTotal = Number(order.amount || 0);
        const fee = chargedTotal - itemsConvertedTotal;

        return {
            orderCurrency,
            baseCurrency,
            fxRate: order.fx_rate,
            itemsConvertedTotal,
            chargedTotal,
            fee,
        };
    }, [order]);

    const handleLinkTransaction = async () => {
        if (!order || !selectedTxId) return;
        setIsLinking(true);
        try {
            await api.post(`/orders/${order.id}/link-transaction`, {
                transaction_id: Number(selectedTxId),
            });
            toast.success('Transaction linked');
            setSelectedTxId('');
            setTxSearch('');
            await fetchData();
        } catch (error: any) {
            console.error('Failed to link transaction:', error);
            toast.error(
                error?.response?.data?.message || 'Failed to link transaction',
            );
        } finally {
            setIsLinking(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Order" />
                <div className="p-6">Loading...</div>
            </AppLayout>
        );
    }

    if (!order) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Order" />
                <div className="p-6">Order not found.</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Order" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit('/orders')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {order.merchant?.name ||
                                    order.provider ||
                                    'Order'}
                                {order.order_number
                                    ? ` #${order.order_number}`
                                    : ''}
                            </h1>
                            <p className="text-muted-foreground">
                                {order.ordered_at} •{' '}
                                {formatCurrency(order.amount, order.currency)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {order.order_url && (
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    window.open(order.order_url!, '_blank')
                                }
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open Order
                            </Button>
                        )}
                        <Button
                            onClick={() =>
                                router.visit(`/orders/${order.id}/edit`)
                            }
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(order.items || []).length === 0 ? (
                                <div className="flex items-center gap-3 rounded-lg border p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">No items</p>
                                        <p className="text-sm text-muted-foreground">
                                            Add items in the edit screen.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                (order.items || []).map((it) => (
                                    <div
                                        key={it.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {it.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Qty {it.quantity}
                                                {it.amount !== null &&
                                                it.amount !== undefined
                                                    ? ` • ${it.amount} ${order.fx_rate ? order.source_currency || order.currency : order.currency}`
                                                    : it.unit_price !== null &&
                                                        it.unit_price !==
                                                            undefined
                                                      ? ` • ${it.unit_price} ${order.fx_rate ? order.source_currency || order.currency : order.currency}`
                                                      : ''}
                                                {it.delivered_at
                                                    ? ` • Delivered ${it.delivered_at}`
                                                    : ''}
                                                {it.status
                                                    ? ` • ${it.status}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {it.product_url && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        window.open(
                                                            it.product_url!,
                                                            '_blank',
                                                        )
                                                    }
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Order</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Status
                                    </span>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                            statusStyles[order.status] ||
                                                statusStyles.placed,
                                        )}
                                    >
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Ordered
                                    </span>
                                    <span className="text-sm font-medium">
                                        {order.ordered_at}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Delivered
                                    </span>
                                    <span className="text-sm font-medium">
                                        {order.delivered_at || '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Total
                                    </span>
                                    <span className="text-sm font-medium">
                                        {formatCurrency(
                                            order.amount,
                                            order.currency,
                                        )}
                                    </span>
                                </div>

                                {(order.provider || order.order_site) && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Marketplace
                                        </span>
                                        <span className="text-sm font-medium">
                                            {order.order_site || order.provider}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {order.fx_rate && computed && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Exchange Rate</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm">
                                        1 {computed.baseCurrency} ={' '}
                                        {order.fx_rate} {computed.orderCurrency}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Items total (converted):{' '}
                                        {computed.itemsConvertedTotal.toFixed(
                                            2,
                                        )}{' '}
                                        {computed.orderCurrency}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Charged total:{' '}
                                        {computed.chargedTotal.toFixed(2)}{' '}
                                        {computed.orderCurrency}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Fees: {computed.fee.toFixed(2)}{' '}
                                        {computed.orderCurrency}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Transactions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {transactions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No transactions linked yet.
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

                                <div className="pt-2">
                                    <Label>Link an existing transaction</Label>
                                    <Input
                                        className="mt-2"
                                        placeholder="Search by title, description, amount..."
                                        value={txSearch}
                                        onChange={(e) =>
                                            setTxSearch(e.target.value)
                                        }
                                    />
                                    <div className="mt-2">
                                        <Select
                                            value={selectedTxId}
                                            onValueChange={setSelectedTxId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select transaction" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {linkableTxResults.length ===
                                                0 ? (
                                                    <SelectItem
                                                        value="__none__"
                                                        disabled
                                                    >
                                                        No linkable results
                                                    </SelectItem>
                                                ) : (
                                                    linkableTxResults.map(
                                                        (t) => (
                                                            <SelectItem
                                                                key={t.id}
                                                                value={String(
                                                                    t.id,
                                                                )}
                                                            >
                                                                {
                                                                    t.transaction_date
                                                                }{' '}
                                                                • {t.title} •{' '}
                                                                {t.amount}{' '}
                                                                {t.currency}
                                                            </SelectItem>
                                                        ),
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        className="mt-2 w-full"
                                        disabled={!selectedTxId || isLinking}
                                        onClick={handleLinkTransaction}
                                    >
                                        <Link2 className="mr-2 h-4 w-4" />
                                        {isLinking
                                            ? 'Linking...'
                                            : 'Link Transaction'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
