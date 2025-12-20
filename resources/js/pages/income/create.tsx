import { Button } from '@/components/ui/button';
import {
    Card as CardUI,
    CardContent,
    CardHeader,
    CardTitle,
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
import type { BankAccount, Category, IncomeFrequency } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Income',
        href: '/income',
    },
    {
        title: 'Create',
        href: '/income/create',
    },
];

const frequencies: { value: IncomeFrequency; label: string }[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi_weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

export default function IncomeCreate() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Data for selects
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [source, setSource] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('CHF');
    const [frequency, setFrequency] = useState<IncomeFrequency>('monthly');
    const [paymentDay, setPaymentDay] = useState('25');
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [endDate, setEndDate] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [autoCreateTransaction, setAutoCreateTransaction] = useState(false);
    const [color, setColor] = useState('#10b981');
    const [icon, setIcon] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [categoriesRes, accountsRes] = await Promise.all([
                api.get('/categories'),
                api.get('/accounts'),
            ]);
            setCategories(
                categoriesRes.data.data.filter(
                    (c: Category) => c.type === 'income',
                ),
            );
            setAccounts(accountsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
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
                frequency,
                payment_day: parseInt(paymentDay),
                start_date: startDate,
                is_active: isActive,
                auto_create_transaction: autoCreateTransaction,
                color,
            };

            if (description) payload.description = description;
            if (source) payload.source = source;
            if (endDate) payload.end_date = endDate;
            if (categoryId) payload.category_id = parseInt(categoryId);
            if (toAccountId) payload.to_account_id = parseInt(toAccountId);
            if (icon) payload.icon = icon;

            await api.post('/recurring-incomes', payload);

            toast.success('Income source added!', {
                description: `${name} has been added to your recurring income.`,
            });

            router.visit('/income');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { errors?: Record<string, string[]> } } };
            if (err.response?.data?.errors) {
                const flatErrors: Record<string, string> = {};
                for (const [key, messages] of Object.entries(
                    err.response.data.errors,
                )) {
                    flatErrors[key] = (messages as string[])[0];
                }
                setErrors(flatErrors);
            } else {
                console.error('Failed to create income:', error);
                toast.error('Failed to add income', {
                    description: 'Please try again.',
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Recurring Income" />
            <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
                <div className="animate-fade-in-up">
                    <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                        New Recurring Income
                    </h1>
                    <p className="text-muted-foreground">
                        Add a regular income source to track
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <CardUI className="animate-fade-in-up stagger-1 opacity-0">
                        <CardHeader>
                            <CardTitle>Income Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., Salary, Freelance, Dividends"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="source">Source</Label>
                                    <Input
                                        id="source"
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                        placeholder="e.g., Company Name, Client Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                    {errors.amount && (
                                        <p className="text-sm text-red-500">
                                            {errors.amount}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CHF">CHF</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Frequency *</Label>
                                    <Select
                                        value={frequency}
                                        onValueChange={(v) => setFrequency(v as IncomeFrequency)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {frequencies.map((freq) => (
                                                <SelectItem key={freq.value} value={freq.value}>
                                                    {freq.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_day">
                                        Payment Day (1-31)
                                    </Label>
                                    <Input
                                        id="payment_day"
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={paymentDay}
                                        onChange={(e) => setPaymentDay(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Start Date *</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_date">End Date (Optional)</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Additional notes..."
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
                                    <Label>Category</Label>
                                    <Select value={categoryId} onValueChange={setCategoryId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id.toString()}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Deposit Account</Label>
                                    <Select value={toAccountId} onValueChange={setToAccountId}>
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
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Appearance */}
                    <CardUI className="animate-fade-in-up stagger-3 opacity-0">
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
                                            onChange={(e) => setColor(e.target.value)}
                                            className="h-10 w-20 cursor-pointer"
                                        />
                                        <Input
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            placeholder="#10b981"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Icon</Label>
                                    <IconPicker value={icon} onChange={setIcon} />
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Settings */}
                    <CardUI className="animate-fade-in-up stagger-4 opacity-0">
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Active</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Track this income source
                                    </p>
                                </div>
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-create Transactions</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically create income transactions
                                    </p>
                                </div>
                                <Switch
                                    checked={autoCreateTransaction}
                                    onCheckedChange={setAutoCreateTransaction}
                                />
                            </div>
                        </CardContent>
                    </CardUI>

                    <div className="flex gap-4 animate-fade-in-up stagger-5 opacity-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/income')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        >
                            {isSubmitting ? 'Creating...' : 'Add Income'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
