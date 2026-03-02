import { CategorySelect } from '@/components/finance/category-select';
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
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type {
    BankAccount,
    Category,
    IncomeFrequency,
    RecurringIncome,
    SalaryAdjustment,
} from '@/types/finance';
import { Plus, Trash2 } from 'lucide-react';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const frequencies: { value: IncomeFrequency; label: string }[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi_weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

export default function IncomeEdit({ incomeId }: { incomeId: string }) {
    const [isLoading, setIsLoading] = useState(true);
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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [autoCreateTransaction, setAutoCreateTransaction] = useState(false);
    const [color, setColor] = useState('#10b981');
    const [icon, setIcon] = useState('');

    const [additions, setAdditions] = useState<SalaryAdjustment[]>([]);
    const [deductions, setDeductions] = useState<SalaryAdjustment[]>([]);

    const addAdjustment = (isAddition: boolean) => {
        const newAdjustment: SalaryAdjustment = {
            name: '',
            amount: 0,
            type: 'fixed',
            value: 0,
        };
        if (isAddition) {
            setAdditions([...additions, newAdjustment]);
        } else {
            setDeductions([...deductions, newAdjustment]);
        }
    };

    const removeAdjustment = (index: number, isAddition: boolean) => {
        if (isAddition) {
            setAdditions(additions.filter((_, i) => i !== index));
        } else {
            setDeductions(deductions.filter((_, i) => i !== index));
        }
    };

    const updateAdjustment = (
        index: number,
        field: keyof SalaryAdjustment,
        value: string | number,
        isAddition: boolean,
    ) => {
        const list = isAddition ? [...additions] : [...deductions];
        const item = { ...list[index] };

        if (field === 'name') {
            item.name = value as string;
        } else if (field === 'type') {
            item.type = value as 'fixed' | 'percentage';
            item.value = 0;
            item.is_overridden = false;
        } else if (field === 'value') {
            item.value = Number(value) || 0;
            item.is_overridden = false;
        } else if (field === 'amount') {
            item.amount = Number(value) || 0;
            item.is_overridden = true;
        }

        list[index] = item;
        if (isAddition) {
            setAdditions(list);
        } else {
            setDeductions(list);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Income',
            href: '/income',
        },
        {
            title: name || 'Edit',
            href: `/income/${incomeId}/edit`,
        },
    ];

    const fetchData = useCallback(async () => {
        try {
            const [incomeRes, categoriesRes, accountsRes] = await Promise.all([
                api.get(`/recurring-incomes/${incomeId}`),
                api.get('/categories'),
                api.get('/accounts'),
            ]);

            const inc: RecurringIncome = incomeRes.data.data;
            setCategories(
                categoriesRes.data.data.filter(
                    (c: Category) => c.type === 'income',
                ),
            );
            setAccounts(accountsRes.data.data);

            // Populate form
            setName(inc.name);
            setDescription(inc.description || '');
            setSource(inc.source || '');
            setAmount(inc.amount.toString());
            setCurrency(inc.currency);
            setFrequency(inc.frequency);
            setPaymentDay(inc.payment_day?.toString() || '25');
            setStartDate(inc.start_date);
            setEndDate(inc.end_date || '');
            setCategoryId(inc.category_id?.toString() || '');
            setToAccountId(inc.to_account_id?.toString() || '');
            setIsActive(inc.is_active);
            setAutoCreateTransaction(inc.auto_create_transaction);
            setColor(inc.color || '#10b981');
            setIcon(inc.icon || '');
            const baseGross = Number(inc.amount) || 0;
            let tempTotalAdditions = 0;

            const loadedAdditions = (inc.additions || []).map((a) => {
                const val = a.value !== undefined && a.value !== null ? a.value : a.amount;
                const calcAmount = a.type === 'percentage' ? baseGross * ((Number(val) || 0) / 100) : (Number(val) || 0);
                const isOverridden = a.type === 'percentage' && a.amount !== undefined && Math.abs(a.amount - calcAmount) > 0.001;
                tempTotalAdditions += isOverridden ? a.amount : calcAmount;
                return { ...a, is_overridden: isOverridden };
            });
            setAdditions(loadedAdditions);

            const grossPlusAdditions = baseGross + tempTotalAdditions;

            const loadedDeductions = (inc.deductions || []).map((d) => {
                const val = d.value !== undefined && d.value !== null ? d.value : d.amount;
                const calcAmount = d.type === 'percentage' ? grossPlusAdditions * ((Number(val) || 0) / 100) : (Number(val) || 0);
                const isOverridden = d.type === 'percentage' && d.amount !== undefined && Math.abs(d.amount - calcAmount) > 0.001;
                return { ...d, is_overridden: isOverridden };
            });
            setDeductions(loadedDeductions);
        } catch (error) {
            console.error('Failed to fetch income:', error);
            toast.error('Failed to load income');
        } finally {
            setIsLoading(false);
        }
    }, [incomeId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCategoryCreated = (newCategory: Category) => {
        setCategories((prev) =>
            [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)),
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
                frequency,
                payment_day: parseInt(paymentDay),
                start_date: startDate,
                is_active: isActive,
                auto_create_transaction: autoCreateTransaction,
                color,
                additions: additions.filter(a => a.name),
                deductions: deductions.filter(d => d.name),
            };

            if (description) payload.description = description;
            if (source) payload.source = source;
            if (endDate) payload.end_date = endDate;
            if (categoryId) payload.category_id = parseInt(categoryId);
            if (toAccountId) payload.to_account_id = parseInt(toAccountId);
            if (icon) payload.icon = icon;

            await api.put(`/recurring-incomes/${incomeId}`, payload);

            toast.success('Income updated!');
            router.visit(`/income/${incomeId}`);
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
                console.error('Failed to update income:', error);
                toast.error('Failed to update income');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const gross = Number(amount) || 0;
    const computedAdditions = additions.map((a) => {
        const calcAmount = a.type === 'percentage' ? gross * ((Number(a.value) || 0) / 100) : (Number(a.value) || 0);
        return a.is_overridden ? (a.amount || 0) : calcAmount;
    });
    const totalAdditions = computedAdditions.reduce((sum, val) => sum + val, 0);

    const grossPlusAdditions = gross + totalAdditions;

    const computedDeductions = deductions.map((d) => {
        const calcAmount = d.type === 'percentage' ? grossPlusAdditions * ((Number(d.value) || 0) / 100) : (Number(d.value) || 0);
        return d.is_overridden ? (d.amount || 0) : calcAmount;
    });
    const totalDeductions = computedDeductions.reduce((sum, val) => sum + val, 0);
    const netAmount = gross + totalAdditions - totalDeductions;

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
                        Edit Income
                    </h1>
                    <p className="text-muted-foreground">Update {name}</p>
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

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="source">Source</Label>
                                    <Input
                                        id="source"
                                        value={source}
                                        onChange={(e) =>
                                            setSource(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Base Amount *</Label>
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
                                    <Label htmlFor="frequency">
                                        Frequency *
                                    </Label>
                                    <Select
                                        value={frequency}
                                        onValueChange={(v) =>
                                            setFrequency(v as IncomeFrequency)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {frequencies.map((freq) => (
                                                <SelectItem
                                                    key={freq.value}
                                                    value={freq.value}
                                                >
                                                    {freq.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_day">
                                        Payment Day
                                    </Label>
                                    <Input
                                        id="payment_day"
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={paymentDay}
                                        onChange={(e) =>
                                            setPaymentDay(e.target.value)
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

                    {/* Fiche de Salaire Layout */}
                    <CardUI className="animate-fade-in-up stagger-2 opacity-0 overflow-hidden">
                        <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 bg-muted/50 p-4 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider border-b">
                            <div>Description</div>
                            <div className="text-right">Rate / Basis</div>
                            <div className="text-right">Amount</div>
                            <div></div>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 items-center text-sm">
                                <div className="font-medium">Salaire de base</div>
                                <div className="text-right text-muted-foreground">-</div>
                                <div className="text-right font-medium">{formatCurrency(gross, currency)}</div>
                                <div></div>
                            </div>

                            {/* Additions Section */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Allocations / Prestations</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => addAdjustment(true)} className="h-7 px-2 text-xs">
                                        <Plus className="mr-1 h-3 w-3" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {additions.length === 0 && (
                                        <div className="text-xs text-muted-foreground italic pl-1">No allocations configured</div>
                                    )}
                                    {additions.map((addition, index) => {
                                        const calcAmount = addition.type === 'percentage' ? gross * ((Number(addition.value) || 0) / 100) : (Number(addition.value) || 0);
                                        return (
                                            <div key={`add-${index}`} className="grid grid-cols-[1fr_120px_120px_40px] gap-2 items-center">
                                                <Input
                                                    placeholder="e.g. Bonus, Allocation enfant"
                                                    className="h-9 text-sm focus-visible:ring-1"
                                                    value={addition.name}
                                                    onChange={(e) => updateAdjustment(index, 'name', e.target.value, true)}
                                                />
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number" step="0.001" min="0"
                                                        className="h-9 text-sm text-right px-2 focus-visible:ring-1"
                                                        value={addition.value || ''}
                                                        onChange={(e) => updateAdjustment(index, 'value', e.target.value, true)}
                                                    />
                                                    <Select value={addition.type || 'fixed'} onValueChange={(val) => updateAdjustment(index, 'type', val, true)}>
                                                        <SelectTrigger className="h-9 w-[50px] px-1.5 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="fixed">$</SelectItem>
                                                            <SelectItem value="percentage">%</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-col items-end pr-1 justify-center relative min-w-[70px]">
                                                    <div className="flex items-center gap-1 group">
                                                        <span className="text-green-600 font-medium">+</span>
                                                        <Input
                                                            type="number" step="0.01"
                                                            className="h-9 w-[80px] text-right text-sm text-green-600 font-medium bg-transparent border-transparent hover:border-input focus-visible:ring-1 focus-visible:border-input focus-visible:bg-background px-1 transition-all"
                                                            value={addition.is_overridden ? addition.amount : calcAmount.toFixed(2)}
                                                            onChange={(e) => updateAdjustment(index, 'amount', e.target.value, true)}
                                                        />
                                                    </div>
                                                    {addition.is_overridden && (
                                                        <span className="text-[10px] text-muted-foreground absolute -bottom-3 right-2 whitespace-nowrap">
                                                            Calc: {calcAmount.toFixed(2)} (Diff: {((addition.amount || 0) - calcAmount).toFixed(2)})
                                                        </span>
                                                    )}
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeAdjustment(index, true)} className="h-9 w-9 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Subtotal: Gross Salary */}
                            <div className="my-4 border-y border-border py-3 grid grid-cols-[1fr_120px_120px_40px] gap-2 items-center text-sm font-bold bg-muted/20 -mx-4 px-4">
                                <div>Salaire Brut (Gross)</div>
                                <div className="text-right text-muted-foreground">-</div>
                                <div className="text-right text-green-600">{formatCurrency(gross + totalAdditions, currency)}</div>
                                <div></div>
                            </div>

                            {/* Deductions Section */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cotisations Sociales / Impôts</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => addAdjustment(false)} className="h-7 px-2 text-xs">
                                        <Plus className="mr-1 h-3 w-3" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {deductions.length === 0 && (
                                        <div className="text-xs text-muted-foreground italic pl-1">No deductions configured</div>
                                    )}
                                    {deductions.map((deduction, index) => {
                                        const calcAmount = deduction.type === 'percentage' ? gross * ((Number(deduction.value) || 0) / 100) : (Number(deduction.value) || 0);
                                        return (
                                            <div key={`ded-${index}`} className="grid grid-cols-[1fr_120px_120px_40px] gap-2 items-center">
                                                <div className="flex bg-background border rounded-md focus-within:ring-1 focus-within:ring-ring">
                                                    <Select onValueChange={(val) => val !== 'custom' && updateAdjustment(index, 'name', val, false)}>
                                                        <SelectTrigger className="h-9 w-[30px] px-1.5 bg-transparent border-0 focus:ring-0 shadow-none"><Plus className="h-3.5 w-3.5 mx-auto" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="AVS/AI/APG">AVS/AI/APG</SelectItem>
                                                            <SelectItem value="AC (Chômage)">AC (Chômage)</SelectItem>
                                                            <SelectItem value="LPP (Prévoyance)">LPP (Prévoyance)</SelectItem>
                                                            <SelectItem value="LAA (Accident non prof.)">LAA (Accident)</SelectItem>
                                                            <SelectItem value="IJM (Maladie)">IJM (Maladie)</SelectItem>
                                                            <SelectItem value="Impôt à la source">Impôt à la source</SelectItem>
                                                            <SelectItem value="custom">Custom...</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        placeholder="e.g. AVS, LPP"
                                                        className="h-9 text-sm flex-1 border-0 focus-visible:ring-0 rounded-none shadow-none px-2"
                                                        value={deduction.name}
                                                        onChange={(e) => updateAdjustment(index, 'name', e.target.value, false)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number" step="0.001" min="0"
                                                        className="h-9 text-sm text-right px-2 focus-visible:ring-1"
                                                        value={deduction.value || ''}
                                                        onChange={(e) => updateAdjustment(index, 'value', e.target.value, false)}
                                                    />
                                                    <Select value={deduction.type || 'fixed'} onValueChange={(val) => updateAdjustment(index, 'type', val, false)}>
                                                        <SelectTrigger className="h-9 w-[50px] px-1.5 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="fixed">$</SelectItem>
                                                            <SelectItem value="percentage">%</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-col items-end pr-1 justify-center relative min-w-[70px]">
                                                    <div className="flex items-center gap-1 group">
                                                        <span className="text-red-600 font-medium">-</span>
                                                        <Input
                                                            type="number" step="0.01"
                                                            className="h-9 w-[80px] text-right text-sm text-red-600 font-medium bg-transparent border-transparent hover:border-input focus-visible:ring-1 focus-visible:border-input focus-visible:bg-background px-1 transition-all"
                                                            value={deduction.is_overridden ? deduction.amount : calcAmount.toFixed(2)}
                                                            onChange={(e) => updateAdjustment(index, 'amount', e.target.value, false)}
                                                        />
                                                    </div>
                                                    {deduction.is_overridden && (
                                                        <span className="text-[10px] text-muted-foreground absolute -bottom-3 right-2 whitespace-nowrap">
                                                            Calc: {calcAmount.toFixed(2)} (Diff: {((deduction.amount || 0) - calcAmount).toFixed(2)})
                                                        </span>
                                                    )}
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeAdjustment(index, false)} className="h-9 w-9 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Final Net Salary */}
                            <div className="mt-5 border-t-[3px] border-border pt-4 grid grid-cols-[1fr_120px_120px_40px] gap-2 items-center text-lg font-bold">
                                <div>Salaire Net Estimé</div>
                                <div className="text-right text-muted-foreground">-</div>
                                <div className="text-right">{formatCurrency(netAmount, currency)}</div>
                                <div></div>
                            </div>
                        </div>
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
                                    <CategorySelect
                                        value={categoryId}
                                        onValueChange={setCategoryId}
                                        categories={categories}
                                        type="income"
                                        onCategoryCreated={
                                            handleCategoryCreated
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Deposit Account</Label>
                                    <Select
                                        value={toAccountId}
                                        onValueChange={setToAccountId}
                                    >
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
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
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

                    <div className="animate-fade-in-up stagger-5 flex gap-4 opacity-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(`/income/${incomeId}`)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
