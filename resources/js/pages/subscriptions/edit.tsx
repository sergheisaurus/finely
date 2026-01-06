import { CategorySelect } from '@/components/finance/category-select';
import { MerchantSelect } from '@/components/finance/merchant-select';
import { Button } from '@/components/ui/button';
import {
    CardContent,
    CardHeader,
    CardTitle,
    Card as CardUI,
} from '@/components/ui/card';
import { IconPicker } from '@/components/ui/icon-picker';
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
import { type BreadcrumbItem } from '@/types';
import type {
    BankAccount,
    BillingCycle,
    Card,
    Category,
    Merchant,
    Subscription,
} from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const billingCycles: { value: BillingCycle; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

export default function SubscriptionEdit({
    subscriptionId,
}: {
    subscriptionId: string;
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Data for selects
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [cards, setCards] = useState<Card[]>([]);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('CHF');
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [billingDay, setBillingDay] = useState('1');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [merchantId, setMerchantId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [paymentMethodType, setPaymentMethodType] = useState<
        'bank_account' | 'card' | ''
    >('');
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [autoCreateTransaction, setAutoCreateTransaction] = useState(true);
    const [reminderDaysBefore, setReminderDaysBefore] = useState('3');
    const [color, setColor] = useState('#8b5cf6');
    const [icon, setIcon] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Subscriptions',
            href: '/subscriptions',
        },
        {
            title: name || 'Edit',
            href: `/subscriptions/${subscriptionId}/edit`,
        },
    ];

    const fetchData = useCallback(async () => {
        try {
            const [subRes, merchantsRes, categoriesRes, accountsRes, cardsRes] =
                await Promise.all([
                    api.get(`/subscriptions/${subscriptionId}`),
                    api.get('/merchants'),
                    api.get('/categories'),
                    api.get('/accounts'),
                    api.get('/cards'),
                ]);

            const sub: Subscription = subRes.data.data;
            setMerchants(merchantsRes.data.data);
            setCategories(
                categoriesRes.data.data.filter(
                    (c: Category) => c.type === 'expense',
                ),
            );
            setAccounts(accountsRes.data.data);
            setCards(cardsRes.data.data);

            // Populate form
            setName(sub.name);
            setDescription(sub.description || '');
            setAmount(sub.amount.toString());
            setCurrency(sub.currency);
            setBillingCycle(sub.billing_cycle);
            setBillingDay(sub.billing_day?.toString() || '1');
            setStartDate(sub.start_date);
            setEndDate(sub.end_date || '');
            setMerchantId(sub.merchant_id?.toString() || '');
            setCategoryId(sub.category_id?.toString() || '');
            setPaymentMethodType(sub.payment_method_type || '');
            setPaymentMethodId(sub.payment_method_id?.toString() || '');
            setIsActive(sub.is_active);
            setAutoCreateTransaction(sub.auto_create_transaction);
            setReminderDaysBefore(sub.reminder_days_before.toString());
            setColor(sub.color || '#8b5cf6');
            setIcon(sub.icon || '');
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
            toast.error('Failed to load subscription');
        } finally {
            setIsLoading(false);
        }
    }, [subscriptionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                name,
                amount: parseFloat(amount),
                currency,
                billing_cycle: billingCycle,
                billing_day: parseInt(billingDay),
                start_date: startDate,
                is_active: isActive,
                auto_create_transaction: autoCreateTransaction,
                reminder_days_before: parseInt(reminderDaysBefore),
                color,
            };

            if (description) payload.description = description;
            if (endDate) payload.end_date = endDate;
            if (merchantId) payload.merchant_id = parseInt(merchantId);
            if (categoryId) payload.category_id = parseInt(categoryId);
            if (paymentMethodType && paymentMethodId) {
                payload.payment_method_type = paymentMethodType;
                payload.payment_method_id = parseInt(paymentMethodId);
            }
            if (icon) payload.icon = icon;

            await api.put(`/subscriptions/${subscriptionId}`, payload);

            toast.success('Subscription updated!');
            router.visit(`/subscriptions/${subscriptionId}`);
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string[]> } };
            };
            if (err.response?.data?.errors) {
                const flatErrors: Record<string, string> = {};
                for (const [key, messages] of Object.entries(
                    err.response.data.errors,
                )) {
                    flatErrors[key] = (messages as string[])[0];
                }
                setErrors(flatErrors);
            } else {
                console.error('Failed to update subscription:', error);
                toast.error('Failed to update subscription');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Loading..." />
                <div className="mx-auto max-w-3xl p-6">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 w-64 rounded bg-muted" />
                        <div className="h-96 rounded-xl bg-muted" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${name}`} />
            <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
                <div className="animate-fade-in-up">
                    <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl dark:from-white dark:to-slate-400">
                        Edit Subscription
                    </h1>
                    <p className="text-muted-foreground">Update {name}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <CardUI className="animate-fade-in-up stagger-1 opacity-0">
                        <CardHeader>
                            <CardTitle>Subscription Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select
                                        value={currency}
                                        onValueChange={setCurrency}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CHF">
                                                CHF
                                            </SelectItem>
                                            <SelectItem value="EUR">
                                                EUR
                                            </SelectItem>
                                            <SelectItem value="USD">
                                                USD
                                            </SelectItem>
                                            <SelectItem value="GBP">
                                                GBP
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="billing_cycle">
                                        Billing Cycle *
                                    </Label>
                                    <Select
                                        value={billingCycle}
                                        onValueChange={(v) =>
                                            setBillingCycle(v as BillingCycle)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {billingCycles.map((cycle) => (
                                                <SelectItem
                                                    key={cycle.value}
                                                    value={cycle.value}
                                                >
                                                    {cycle.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="billing_day">
                                        Billing Day
                                    </Label>
                                    <Input
                                        id="billing_day"
                                        type="number"
                                        min={billingCycle === 'weekly' ? 0 : 1}
                                        max={billingCycle === 'weekly' ? 6 : 31}
                                        value={billingDay}
                                        onChange={(e) =>
                                            setBillingDay(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="start_date">
                                        Start Date *
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) =>
                                            setStartDate(e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_date">End Date</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Categorization */}
                    <CardUI className="animate-fade-in-up stagger-2 opacity-0">
                        <CardHeader>
                            <CardTitle>Categorization</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Merchant</Label>
                                    <MerchantSelect
                                        value={merchantId}
                                        onValueChange={setMerchantId}
                                        merchants={merchants}
                                        onMerchantCreated={
                                            handleMerchantCreated
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <CategorySelect
                                        value={categoryId}
                                        onValueChange={setCategoryId}
                                        categories={categories}
                                        type="expense"
                                        onCategoryCreated={
                                            handleCategoryCreated
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Payment Method */}
                    <CardUI className="animate-fade-in-up stagger-3 opacity-0">
                        <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Payment Type</Label>
                                    <Select
                                        value={paymentMethodType}
                                        onValueChange={(v) => {
                                            setPaymentMethodType(
                                                v as
                                                    | 'bank_account'
                                                    | 'card'
                                                    | '',
                                            );
                                            setPaymentMethodId('');
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank_account">
                                                Bank Account
                                            </SelectItem>
                                            <SelectItem value="card">
                                                Card
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {paymentMethodType && (
                                    <div className="space-y-2">
                                        <Label>
                                            {paymentMethodType ===
                                            'bank_account'
                                                ? 'Account'
                                                : 'Card'}
                                        </Label>
                                        <Select
                                            value={paymentMethodId}
                                            onValueChange={setPaymentMethodId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paymentMethodType ===
                                                'bank_account'
                                                    ? accounts.map(
                                                          (account) => (
                                                              <SelectItem
                                                                  key={
                                                                      account.id
                                                                  }
                                                                  value={account.id.toString()}
                                                              >
                                                                  {account.name}
                                                              </SelectItem>
                                                          ),
                                                      )
                                                    : cards.map((card) => (
                                                          <SelectItem
                                                              key={card.id}
                                                              value={card.id.toString()}
                                                          >
                                                              {
                                                                  card.card_holder_name
                                                              }{' '}
                                                              ****
                                                              {card.card_number.slice(
                                                                  -4,
                                                              )}
                                                          </SelectItem>
                                                      ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Appearance */}
                    <CardUI className="animate-fade-in-up stagger-4 opacity-0">
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="color"
                                            type="color"
                                            value={color}
                                            onChange={(e) =>
                                                setColor(e.target.value)
                                            }
                                            className="h-10 w-20 cursor-pointer"
                                        />
                                        <Input
                                            value={color}
                                            onChange={(e) =>
                                                setColor(e.target.value)
                                            }
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Icon</Label>
                                    <IconPicker
                                        value={icon}
                                        onChange={setIcon}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Settings */}
                    <CardUI className="animate-fade-in-up stagger-5 opacity-0">
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Active</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Track this subscription
                                    </p>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-create Transactions</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically create expense
                                        transactions
                                    </p>
                                </div>
                                <Switch
                                    checked={autoCreateTransaction}
                                    onCheckedChange={setAutoCreateTransaction}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reminder_days">
                                    Reminder (days before)
                                </Label>
                                <Input
                                    id="reminder_days"
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={reminderDaysBefore}
                                    onChange={(e) =>
                                        setReminderDaysBefore(e.target.value)
                                    }
                                    className="w-32"
                                />
                            </div>
                        </CardContent>
                    </CardUI>

                    <div className="animate-fade-in-up stagger-6 flex gap-4 opacity-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.visit(`/subscriptions/${subscriptionId}`)
                            }
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
