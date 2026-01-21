import { AmountInput } from '@/components/finance/amount-input';
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
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import type { BankAccount, Card } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CardEditProps {
    cardId: string;
}

const colorOptions = [
    '#1e3a8a', // Blue
    '#9333ea', // Purple
    '#dc2626', // Red
    '#ea580c', // Orange
    '#65a30d', // Green
    '#0891b2', // Cyan
    '#4f46e5', // Indigo
    '#be123c', // Rose
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

export default function CardEdit({ cardId }: CardEditProps) {
    const [card, setCard] = useState<Card | null>(null);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form fields
    const [type, setType] = useState<'debit' | 'credit'>('debit');
    const [bankAccountId, setBankAccountId] = useState('');
    const [cardHolderName, setCardHolderName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardNetwork, setCardNetwork] = useState('visa');
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [creditLimit, setCreditLimit] = useState('0');
    const [currentBalance, setCurrentBalance] = useState('0');
    const [paymentDueDay, setPaymentDueDay] = useState('');
    const [billingCycleDay, setBillingCycleDay] = useState('');
    const [color, setColor] = useState(colorOptions[0]);
    const [isDefault, setIsDefault] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Cards',
            href: '/cards',
        },
        {
            title: card?.card_holder_name || 'Card',
            href: card ? `/cards/${card.id}` : '#',
        },
        {
            title: 'Edit',
            href: `/cards/${cardId}/edit`,
        },
    ];

    const fetchCard = useCallback(async () => {
        try {
            const response = await api.get(`/cards/${cardId}`);
            const data = response.data.data;
            setCard(data);

            // Populate form fields
            setType(data.type);
            setBankAccountId(data.bank_account_id?.toString() || '');
            setCardHolderName(data.card_holder_name);
            setCardNumber(data.card_number || '');
            setCardNetwork(data.card_network);
            setExpiryMonth(data.expiry_month.toString());
            setExpiryYear(data.expiry_year.toString());
            setCreditLimit(data.credit_limit?.toString() || '0');
            setCurrentBalance(data.current_balance.toString());
            setPaymentDueDay(data.payment_due_day?.toString() || '');
            setBillingCycleDay(data.billing_cycle_day?.toString() || '');
            setColor(data.color);
            setIsDefault(data.is_default);
        } catch (error) {
            console.error('Failed to fetch card:', error);
        }
    }, [cardId]);

    const fetchAccounts = useCallback(async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    }, []);

    useEffect(() => {
        Promise.all([fetchCard(), fetchAccounts()]).finally(() =>
            setIsLoadingData(false),
        );
    }, [fetchCard, fetchAccounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const payload: Record<string, unknown> = {
                type,
                card_holder_name: cardHolderName,
                card_number: cardNumber,
                card_network: cardNetwork,
                expiry_month: parseInt(expiryMonth),
                expiry_year: parseInt(expiryYear),
                color,
                is_default: isDefault,
            };

            if (type === 'debit') {
                payload.bank_account_id = bankAccountId
                    ? parseInt(bankAccountId)
                    : null;
            } else if (type === 'credit') {
                if (bankAccountId) {
                    payload.bank_account_id = parseInt(bankAccountId);
                }
                payload.credit_limit = parseFloat(creditLimit) || 0;
                payload.current_balance = parseFloat(currentBalance) || 0;
                if (paymentDueDay) {
                    payload.payment_due_day = parseInt(paymentDueDay);
                }
                if (billingCycleDay) {
                    payload.billing_cycle_day = parseInt(billingCycleDay);
                }
            }

            await api.put(`/cards/${cardId}`, payload);

            toast.success('Card updated successfully!', {
                description: `${cardHolderName} has been updated.`,
            });

            router.visit(`/cards/${cardId}`);
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string> } };
            };
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                console.error('Failed to update card:', error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Loading..." />
                <div className="mx-auto max-w-3xl space-y-6 p-6">
                    <div className="h-96 animate-pulse rounded-lg bg-muted" />
                </div>
            </AppLayout>
        );
    }

    if (!card) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Card Not Found" />
                <div className="mx-auto max-w-3xl p-6">
                    <CardUI>
                        <CardContent className="p-12 text-center">
                            <h3 className="text-lg font-semibold">
                                Card not found
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                The card you're trying to edit doesn't exist
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
            <Head title={`Edit ${card.card_holder_name}`} />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">Edit Card</h1>
                    <p className="text-muted-foreground">
                        Update your card details
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <CardUI>
                        <CardHeader>
                            <CardTitle>Card Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Card Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="type">Card Type *</Label>
                                    <Select
                                        value={type}
                                        onValueChange={(
                                            value: 'debit' | 'credit',
                                        ) => setType(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="debit">
                                                Debit
                                            </SelectItem>
                                            <SelectItem value="credit">
                                                Credit
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-red-500">
                                            {errors.type}
                                        </p>
                                    )}
                                </div>

                                {/* Bank Account */}
                                <div className="space-y-2">
                                    <Label htmlFor="bank_account">
                                        Bank Account {type === 'debit' && '*'}
                                    </Label>
                                    <Select
                                        value={bankAccountId || undefined}
                                        onValueChange={setBankAccountId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account (optional)" />
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
                                    {errors.bank_account_id && (
                                        <p className="text-sm text-red-500">
                                            {errors.bank_account_id}
                                        </p>
                                    )}
                                </div>

                                {/* Card Holder Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="card_holder_name">
                                        Card Holder Name *
                                    </Label>
                                    <Input
                                        id="card_holder_name"
                                        value={cardHolderName}
                                        onChange={(e) =>
                                            setCardHolderName(e.target.value)
                                        }
                                        placeholder="JOHN DOE"
                                        required
                                    />
                                    {errors.card_holder_name && (
                                        <p className="text-sm text-red-500">
                                            {errors.card_holder_name}
                                        </p>
                                    )}
                                </div>

                                {/* Card Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="card_number">
                                        Card Number *
                                    </Label>
                                    <Input
                                        id="card_number"
                                        value={cardNumber}
                                        onChange={(e) =>
                                            setCardNumber(
                                                e.target.value.replace(
                                                    /\s/g,
                                                    '',
                                                ),
                                            )
                                        }
                                        placeholder="1234567890123456"
                                        maxLength={19}
                                        pattern="\d{13,19}"
                                        required
                                    />
                                    {errors.card_number && (
                                        <p className="text-sm text-red-500">
                                            {errors.card_number}
                                        </p>
                                    )}
                                </div>

                                {/* Card Network */}
                                <div className="space-y-2">
                                    <Label htmlFor="card_network">
                                        Card Network *
                                    </Label>
                                    <Select
                                        value={cardNetwork}
                                        onValueChange={setCardNetwork}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="visa">
                                                Visa
                                            </SelectItem>
                                            <SelectItem value="mastercard">
                                                Mastercard
                                            </SelectItem>
                                            <SelectItem value="amex">
                                                American Express
                                            </SelectItem>
                                            <SelectItem value="discover">
                                                Discover
                                            </SelectItem>
                                            <SelectItem value="other">
                                                Other
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.card_network && (
                                        <p className="text-sm text-red-500">
                                            {errors.card_network}
                                        </p>
                                    )}
                                </div>

                                {/* Expiry Month */}
                                <div className="space-y-2">
                                    <Label htmlFor="expiry_month">
                                        Expiry Month *
                                    </Label>
                                    <Select
                                        value={expiryMonth}
                                        onValueChange={setExpiryMonth}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map((month) => (
                                                <SelectItem
                                                    key={month}
                                                    value={month.toString()}
                                                >
                                                    {month
                                                        .toString()
                                                        .padStart(2, '0')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.expiry_month && (
                                        <p className="text-sm text-red-500">
                                            {errors.expiry_month}
                                        </p>
                                    )}
                                </div>

                                {/* Expiry Year */}
                                <div className="space-y-2">
                                    <Label htmlFor="expiry_year">
                                        Expiry Year *
                                    </Label>
                                    <Select
                                        value={expiryYear}
                                        onValueChange={setExpiryYear}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem
                                                    key={year}
                                                    value={year.toString()}
                                                >
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.expiry_year && (
                                        <p className="text-sm text-red-500">
                                            {errors.expiry_year}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Credit Card Specific Fields */}
                            {type === 'credit' && (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="credit_limit">
                                            Credit Limit *
                                        </Label>
                                        <AmountInput
                                            name="credit_limit"
                                            value={parseFloat(creditLimit) || 0}
                                            onChange={(value) =>
                                                setCreditLimit(value.toString())
                                            }
                                            currency="CHF"
                                            required
                                        />
                                        {errors.credit_limit && (
                                            <p className="text-sm text-red-500">
                                                {errors.credit_limit}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="current_balance">
                                            Current Balance
                                        </Label>
                                        <AmountInput
                                            name="current_balance"
                                            value={
                                                parseFloat(currentBalance) || 0
                                            }
                                            onChange={(value) =>
                                                setCurrentBalance(
                                                    value.toString(),
                                                )
                                            }
                                            currency="CHF"
                                        />
                                        {errors.current_balance && (
                                            <p className="text-sm text-red-500">
                                                {errors.current_balance}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="payment_due_day">
                                            Payment Due Day (Optional)
                                        </Label>
                                        <Select
                                            value={paymentDueDay || undefined}
                                            onValueChange={setPaymentDueDay}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select day" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from(
                                                    { length: 31 },
                                                    (_, i) => i + 1,
                                                ).map((day) => (
                                                    <SelectItem
                                                        key={day}
                                                        value={day.toString()}
                                                    >
                                                        {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.payment_due_day && (
                                            <p className="text-sm text-red-500">
                                                {errors.payment_due_day}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="billing_cycle_day">
                                            Billing Cycle Day (Optional)
                                        </Label>
                                        <Select
                                            value={billingCycleDay || undefined}
                                            onValueChange={setBillingCycleDay}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select day" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from(
                                                    { length: 31 },
                                                    (_, i) => i + 1,
                                                ).map((day) => (
                                                    <SelectItem
                                                        key={day}
                                                        value={day.toString()}
                                                    >
                                                        {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.billing_cycle_day && (
                                            <p className="text-sm text-red-500">
                                                {errors.billing_cycle_day}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Card Color */}
                            <div className="space-y-2">
                                <Label>Card Color</Label>
                                <div className="flex gap-2">
                                    {colorOptions.map((colorOption) => (
                                        <button
                                            key={colorOption}
                                            type="button"
                                            className="h-10 w-10 rounded-lg transition-all hover:scale-110"
                                            style={{
                                                backgroundColor: colorOption,
                                                border:
                                                    color === colorOption
                                                        ? '3px solid black'
                                                        : 'none',
                                            }}
                                            onClick={() =>
                                                setColor(colorOption)
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Default Card */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_default"
                                    checked={isDefault}
                                    onChange={(e) =>
                                        setIsDefault(e.target.checked)
                                    }
                                    className="h-4 w-4"
                                />
                                <Label
                                    htmlFor="is_default"
                                    className="cursor-pointer"
                                >
                                    Set as default card
                                </Label>
                            </div>

                            {/* Preview */}
                            <div className="rounded-lg border p-4">
                                <h4 className="mb-4 font-medium">Preview</h4>
                                <div
                                    className="relative h-48 w-80 rounded-xl p-6 text-white shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                                    }}
                                >
                                    <div className="flex h-full flex-col justify-between">
                                        <div className="flex items-center justify-between">
                                            <CreditCard className="h-8 w-8" />
                                            <span className="text-sm font-medium uppercase">
                                                {cardNetwork}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="mb-2 text-lg tracking-wider">
                                                {cardNumber
                                                    ? cardNumber
                                                          .replace(
                                                              /(\d{4})/g,
                                                              '$1 ',
                                                          )
                                                          .trim()
                                                    : '•••• •••• •••• ••••'}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm uppercase">
                                                    {cardHolderName ||
                                                        'CARD HOLDER'}
                                                </span>
                                                <span className="text-sm">
                                                    {expiryMonth && expiryYear
                                                        ? `${expiryMonth.padStart(2, '0')}/${expiryYear.slice(-2)}`
                                                        : '••/••'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    <div className="mt-6 flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(`/cards/${cardId}`)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
