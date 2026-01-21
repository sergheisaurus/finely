import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
import type {
    BankAccount,
    BillingCycle,
    Card as CardType,
    Category,
    Merchant,
} from '@/types/finance';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SubscriptionsStepProps {
    accounts: BankAccount[];
    cards: CardType[];
    categories: Category[];
    merchants: Merchant[];
    onSubmit: (data: unknown[]) => Promise<void>;
    onSkip: () => void;
    isSubmitting: boolean;
}

interface SubscriptionFormData {
    id: string;
    name: string;
    amount: string;
    currency: string;
    billing_cycle: BillingCycle;
    billing_day: string;
    start_date: string;
    payment_method_type: 'bank_account' | 'card' | '';
    payment_method_id: string;
    category_id: string;
    merchant_id: string;
}

const billingCycles: { value: BillingCycle; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

const generateId = () => Math.random().toString(36).substring(2, 15);

const emptySubscription = (): SubscriptionFormData => ({
    id: generateId(),
    name: '',
    amount: '',
    currency: 'CHF',
    billing_cycle: 'monthly',
    billing_day: '1',
    start_date: new Date().toISOString().split('T')[0],
    payment_method_type: '',
    payment_method_id: '',
    category_id: '',
    merchant_id: '',
});

export default function SubscriptionsStep({
    accounts,
    cards,
    categories,
    merchants,
    onSubmit,
    onSkip,
    isSubmitting,
}: SubscriptionsStepProps) {
    const [subscriptions, setSubscriptions] = useState<SubscriptionFormData[]>(
        [],
    );

    const addSubscription = () => {
        const newSub = emptySubscription();
        if (accounts.length > 0) {
            newSub.payment_method_type = 'bank_account';
            newSub.payment_method_id = accounts[0].id.toString();
        }
        setSubscriptions([...subscriptions, newSub]);
    };

    const removeSubscription = (id: string) => {
        setSubscriptions(subscriptions.filter((s) => s.id !== id));
    };

    const updateSubscription = (
        id: string,
        field: keyof SubscriptionFormData,
        value: string,
    ) => {
        setSubscriptions(
            subscriptions.map((s) => {
                if (s.id !== id) return s;
                const updated = { ...s, [field]: value };
                // Reset payment method id when type changes
                if (field === 'payment_method_type') {
                    updated.payment_method_id = '';
                }
                return updated;
            }),
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formattedSubs = subscriptions.map((sub) => ({
            name: sub.name,
            amount: parseFloat(sub.amount),
            currency: sub.currency,
            billing_cycle: sub.billing_cycle,
            billing_day: parseInt(sub.billing_day),
            start_date: sub.start_date,
            payment_method_type: sub.payment_method_type || null,
            payment_method_id: sub.payment_method_id
                ? parseInt(sub.payment_method_id)
                : null,
            category_id: sub.category_id ? parseInt(sub.category_id) : null,
            merchant_id: sub.merchant_id ? parseInt(sub.merchant_id) : null,
            is_active: true,
            auto_create_transaction: true,
        }));

        await onSubmit(formattedSubs);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Set Up Subscriptions
                </CardTitle>
                <CardDescription>
                    Track recurring payments like Netflix, Spotify, gym
                    memberships, etc.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {subscriptions.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed p-8 text-center">
                            <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">
                                No subscriptions added yet. Add your recurring
                                payments or skip.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addSubscription}
                                className="mt-4"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Subscription
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {subscriptions.map((sub, index) => (
                                <div
                                    key={sub.id}
                                    className="space-y-4 rounded-lg border p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">
                                            Subscription {index + 1}
                                        </h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                removeSubscription(sub.id)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Name *</Label>
                                            <Input
                                                value={sub.name}
                                                onChange={(e) =>
                                                    updateSubscription(
                                                        sub.id,
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Netflix, Spotify, Gym..."
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Amount *</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={sub.amount}
                                                onChange={(e) =>
                                                    updateSubscription(
                                                        sub.id,
                                                        'amount',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="9.99"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Currency</Label>
                                            <Select
                                                value={sub.currency}
                                                onValueChange={(v) =>
                                                    updateSubscription(
                                                        sub.id,
                                                        'currency',
                                                        v,
                                                    )
                                                }
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
                                            <Label>Billing Cycle *</Label>
                                            <Select
                                                value={sub.billing_cycle}
                                                onValueChange={(v) =>
                                                    updateSubscription(
                                                        sub.id,
                                                        'billing_cycle',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {billingCycles.map(
                                                        (cycle) => (
                                                            <SelectItem
                                                                key={
                                                                    cycle.value
                                                                }
                                                                value={
                                                                    cycle.value
                                                                }
                                                            >
                                                                {cycle.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Billing Day</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={sub.billing_day}
                                                onChange={(e) =>
                                                    updateSubscription(
                                                        sub.id,
                                                        'billing_day',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Start Date *</Label>
                                            <Input
                                                type="date"
                                                value={sub.start_date}
                                                onChange={(e) =>
                                                    updateSubscription(
                                                        sub.id,
                                                        'start_date',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Payment Type</Label>
                                            <Select
                                                value={
                                                    sub.payment_method_type ||
                                                    '__none__'
                                                }
                                                onValueChange={(v) =>
                                                    updateSubscription(
                                                        sub.id,
                                                        'payment_method_type',
                                                        v === '__none__'
                                                            ? ''
                                                            : v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">
                                                        Not specified
                                                    </SelectItem>
                                                    <SelectItem value="bank_account">
                                                        Bank Account
                                                    </SelectItem>
                                                    {cards.length > 0 && (
                                                        <SelectItem value="card">
                                                            Card
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {sub.payment_method_type && (
                                            <div className="space-y-2">
                                                <Label>
                                                    {sub.payment_method_type ===
                                                    'bank_account'
                                                        ? 'Account'
                                                        : 'Card'}
                                                </Label>
                                                <Select
                                                    value={
                                                        sub.payment_method_id ||
                                                        '__none__'
                                                    }
                                                    onValueChange={(v) =>
                                                        updateSubscription(
                                                            sub.id,
                                                            'payment_method_id',
                                                            v === '__none__'
                                                                ? ''
                                                                : v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">
                                                            Not specified
                                                        </SelectItem>
                                                        {sub.payment_method_type ===
                                                        'bank_account'
                                                            ? accounts.map(
                                                                  (acc) => (
                                                                      <SelectItem
                                                                          key={
                                                                              acc.id
                                                                          }
                                                                          value={acc.id.toString()}
                                                                      >
                                                                          {
                                                                              acc.name
                                                                          }
                                                                      </SelectItem>
                                                                  ),
                                                              )
                                                            : cards.map(
                                                                  (card) => (
                                                                      <SelectItem
                                                                          key={
                                                                              card.id
                                                                          }
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
                                                                  ),
                                                              )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {categories.length > 0 && (
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <Select
                                                    value={
                                                        sub.category_id ||
                                                        '__none__'
                                                    }
                                                    onValueChange={(v) =>
                                                        updateSubscription(
                                                            sub.id,
                                                            'category_id',
                                                            v === '__none__'
                                                                ? ''
                                                                : v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">
                                                            None
                                                        </SelectItem>
                                                        {categories.map(
                                                            (cat) => (
                                                                <SelectItem
                                                                    key={cat.id}
                                                                    value={cat.id.toString()}
                                                                >
                                                                    {cat.name}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {merchants.length > 0 && (
                                            <div className="space-y-2">
                                                <Label>Merchant</Label>
                                                <Select
                                                    value={
                                                        sub.merchant_id ||
                                                        '__none__'
                                                    }
                                                    onValueChange={(v) =>
                                                        updateSubscription(
                                                            sub.id,
                                                            'merchant_id',
                                                            v === '__none__'
                                                                ? ''
                                                                : v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select merchant" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">
                                                            None
                                                        </SelectItem>
                                                        {merchants.map((m) => (
                                                            <SelectItem
                                                                key={m.id}
                                                                value={m.id.toString()}
                                                            >
                                                                {m.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addSubscription}
                                className="w-full"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Another Subscription
                            </Button>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onSkip}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Skip for now
                        </Button>
                        {subscriptions.length > 0 && (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                            >
                                {isSubmitting ? 'Saving...' : 'Save & Continue'}
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
