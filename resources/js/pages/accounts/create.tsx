import { AmountInput } from '@/components/finance/amount-input';
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
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounts',
        href: '/accounts',
    },
    {
        title: 'Create',
        href: '/accounts/create',
    },
];

const colorOptions = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
];

export default function AccountsCreate() {
    const [name, setName] = useState('');
    const [type, setType] = useState<'checking' | 'savings'>('checking');
    const [balance, setBalance] = useState('0');
    const [currency, setCurrency] = useState('CHF');
    const [accountNumber, setAccountNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [color, setColor] = useState(colorOptions[0]);
    const [isDefault, setIsDefault] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            const response = await api.post('/accounts', {
                name,
                type,
                balance: parseFloat(balance) || 0,
                currency,
                account_number: accountNumber || null,
                bank_name: bankName || null,
                color,
                is_default: isDefault,
            });

            toast.success('Account created successfully!', {
                description: `${name} has been added to your accounts.`,
            });

            router.visit(`/accounts/${response.data.data.id}`);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { errors?: Record<string, string> } } };
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                console.error('Failed to create account:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Account" />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">Create Bank Account</h1>
                    <p className="text-muted-foreground">
                        Add a new bank account to track your finances
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Account Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="My Checking Account"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Account Type *</Label>
                                    <Select
                                        value={type}
                                        onValueChange={(value: 'checking' | 'savings') =>
                                            setType(value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="checking">
                                                Checking
                                            </SelectItem>
                                            <SelectItem value="savings">
                                                Savings
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-red-500">
                                            {errors.type}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="balance">
                                        Initial Balance *
                                    </Label>
                                    <AmountInput
                                        name="balance"
                                        value={parseFloat(balance) || 0}
                                        onChange={(value) => setBalance(value.toString())}
                                        currency={currency}
                                        required
                                    />
                                    {errors.balance && (
                                        <p className="text-sm text-red-500">
                                            {errors.balance}
                                        </p>
                                    )}
                                </div>

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

                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">Bank Name</Label>
                                    <Input
                                        id="bank_name"
                                        value={bankName}
                                        onChange={(e) =>
                                            setBankName(e.target.value)
                                        }
                                        placeholder="Chase, Bank of America, etc."
                                    />
                                    {errors.bank_name && (
                                        <p className="text-sm text-red-500">
                                            {errors.bank_name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="account_number">
                                        Account Number
                                    </Label>
                                    <Input
                                        id="account_number"
                                        value={accountNumber}
                                        onChange={(e) =>
                                            setAccountNumber(e.target.value)
                                        }
                                        placeholder="****1234"
                                    />
                                    {errors.account_number && (
                                        <p className="text-sm text-red-500">
                                            {errors.account_number}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Account Color</Label>
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
                                            onClick={() => setColor(colorOption)}
                                        />
                                    ))}
                                </div>
                            </div>

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
                                <Label htmlFor="is_default" className="cursor-pointer">
                                    Set as default account
                                </Label>
                            </div>

                            <div className="rounded-lg border p-4">
                                <h4 className="mb-2 font-medium">Preview</h4>
                                <div className="flex items-center gap-4">
                                    <div
                                        className="flex h-16 w-16 items-center justify-center rounded-xl"
                                        style={{ backgroundColor: color }}
                                    >
                                        <Building2 className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">
                                            {name || 'Account Name'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {bankName || 'Bank Name'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/accounts')}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Account'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
