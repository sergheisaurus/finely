import { Button } from '@/components/ui/button';
import {
    Card as CardUI,
    CardContent,
    CardDescription,
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
import type { BudgetPeriod, Category } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Budgets',
        href: '/budgets',
    },
    {
        title: 'Create',
        href: '/budgets/create',
    },
];

const periods: { value: BudgetPeriod; label: string }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

export default function BudgetCreate() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Data for selects
    const [categories, setCategories] = useState<Category[]>([]);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('CHF');
    const [period, setPeriod] = useState<BudgetPeriod>('monthly');
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [endDate, setEndDate] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [rolloverUnused, setRolloverUnused] = useState(false);
    const [alertThreshold, setAlertThreshold] = useState('80');
    const [isActive, setIsActive] = useState(true);
    const [color, setColor] = useState('#4f46e5');
    const [icon, setIcon] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const categoriesRes = await api.get('/categories');
            setCategories(
                categoriesRes.data.data.filter(
                    (c: Category) => c.type === 'expense',
                ),
            );
        } catch (error) {
            console.error('Failed to fetch categories:', error);
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
                period,
                start_date: startDate,
                rollover_unused: rolloverUnused,
                alert_threshold: parseInt(alertThreshold),
                is_active: isActive,
                color,
            };

            if (description) payload.description = description;
            if (endDate) payload.end_date = endDate;
            if (categoryId) payload.category_id = parseInt(categoryId);
            if (icon) payload.icon = icon;

            await api.post('/budgets', payload);

            toast.success('Budget created!', {
                description: `${name} budget has been created.`,
            });

            router.visit('/budgets');
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
                console.error('Failed to create budget:', error);
                toast.error('Failed to create budget', {
                    description: 'Please try again.',
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Budget" />
            <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
                <div className="animate-fade-in-up">
                    <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                        Create Budget
                    </h1>
                    <p className="text-muted-foreground">
                        Set up a new budget to track your spending
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <CardUI className="animate-fade-in-up stagger-1 opacity-0">
                        <CardHeader>
                            <CardTitle>Budget Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., Monthly Groceries, Entertainment"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Budget Amount *</Label>
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
                                    <Label htmlFor="period">Budget Period *</Label>
                                    <Select
                                        value={period}
                                        onValueChange={(v) => setPeriod(v as BudgetPeriod)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {periods.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                    {errors.start_date && (
                                        <p className="text-sm text-red-500">
                                            {errors.start_date}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_date">End Date (Optional)</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty for an ongoing budget
                                    </p>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Additional notes about this budget..."
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Category */}
                    <CardUI className="animate-fade-in-up stagger-2 opacity-0">
                        <CardHeader>
                            <CardTitle>Category</CardTitle>
                            <CardDescription>
                                Assign this budget to a specific expense category, or leave empty for an overall budget
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Overall Budget (all expenses)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">
                                            Overall Budget (all expenses)
                                        </SelectItem>
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
                                <p className="text-xs text-muted-foreground">
                                    {categoryId
                                        ? 'This budget will track spending in the selected category only'
                                        : 'This budget will track all expenses across all categories'}
                                </p>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Rollover Settings */}
                    <CardUI className="animate-fade-in-up stagger-3 opacity-0">
                        <CardHeader>
                            <CardTitle>Rollover Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Rollover Unused Budget</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Carry forward unused budget to the next period
                                    </p>
                                </div>
                                <Switch
                                    checked={rolloverUnused}
                                    onCheckedChange={setRolloverUnused}
                                />
                            </div>
                            {rolloverUnused && (
                                <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                                    If you spend less than your budget, the remaining amount will be added to your next period&apos;s budget.
                                </p>
                            )}
                        </CardContent>
                    </CardUI>

                    {/* Alert Settings */}
                    <CardUI className="animate-fade-in-up stagger-4 opacity-0">
                        <CardHeader>
                            <CardTitle>Alert Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="alert_threshold">
                                    Alert Threshold (%)
                                </Label>
                                <Input
                                    id="alert_threshold"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={alertThreshold}
                                    onChange={(e) => setAlertThreshold(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    You&apos;ll be alerted when spending reaches {alertThreshold}% of the budget
                                </p>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Appearance */}
                    <CardUI className="animate-fade-in-up stagger-5 opacity-0">
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
                                            placeholder="#4f46e5"
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
                    <CardUI className="animate-fade-in-up stagger-6 opacity-0">
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Active</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Start tracking this budget immediately
                                    </p>
                                </div>
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                            </div>
                        </CardContent>
                    </CardUI>

                    <div className="flex gap-4 animate-fade-in-up stagger-7 opacity-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/budgets')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Budget'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
