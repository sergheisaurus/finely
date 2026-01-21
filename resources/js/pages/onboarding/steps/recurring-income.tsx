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
import type { BankAccount, Category, IncomeFrequency } from '@/types/finance';
import { Banknote, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface RecurringIncomeStepProps {
    accounts: BankAccount[];
    categories: Category[];
    onSubmit: (data: unknown[]) => Promise<void>;
    onSkip: () => void;
    isSubmitting: boolean;
}

interface IncomeFormData {
    id: string;
    name: string;
    source: string;
    amount: string;
    currency: string;
    frequency: IncomeFrequency;
    payment_day: string;
    start_date: string;
    to_account_id: string;
    category_id: string;
}

const frequencies: { value: IncomeFrequency; label: string }[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi_weekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

const generateId = () => Math.random().toString(36).substring(2, 15);

const emptyIncome = (): IncomeFormData => ({
    id: generateId(),
    name: '',
    source: '',
    amount: '',
    currency: 'CHF',
    frequency: 'monthly',
    payment_day: '25',
    start_date: new Date().toISOString().split('T')[0],
    to_account_id: '',
    category_id: '',
});

export default function RecurringIncomeStep({
    accounts,
    categories,
    onSubmit,
    onSkip,
    isSubmitting,
}: RecurringIncomeStepProps) {
    const [incomes, setIncomes] = useState<IncomeFormData[]>([]);

    const addIncome = () => {
        const newIncome = emptyIncome();
        if (accounts.length > 0) {
            newIncome.to_account_id = accounts[0].id.toString();
        }
        setIncomes([...incomes, newIncome]);
    };

    const removeIncome = (id: string) => {
        setIncomes(incomes.filter((i) => i.id !== id));
    };

    const updateIncome = (
        id: string,
        field: keyof IncomeFormData,
        value: string,
    ) => {
        setIncomes(
            incomes.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formattedIncomes = incomes.map((income) => ({
            name: income.name,
            source: income.source || null,
            amount: parseFloat(income.amount),
            currency: income.currency,
            frequency: income.frequency,
            payment_day: parseInt(income.payment_day),
            start_date: income.start_date,
            to_account_id: income.to_account_id
                ? parseInt(income.to_account_id)
                : null,
            category_id: income.category_id
                ? parseInt(income.category_id)
                : null,
            is_active: true,
            auto_create_transaction: true,
        }));

        await onSubmit(formattedIncomes);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Set Up Recurring Income
                </CardTitle>
                <CardDescription>
                    Add your salary, freelance income, or other recurring income
                    sources.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {incomes.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed p-8 text-center">
                            <Banknote className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">
                                No income sources added yet. Add your recurring
                                income or skip.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addIncome}
                                className="mt-4"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Income Source
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {incomes.map((income, index) => (
                                <div
                                    key={income.id}
                                    className="space-y-4 rounded-lg border p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">
                                            Income {index + 1}
                                        </h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                removeIncome(income.id)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Name *</Label>
                                            <Input
                                                value={income.name}
                                                onChange={(e) =>
                                                    updateIncome(
                                                        income.id,
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Monthly Salary"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Source</Label>
                                            <Input
                                                value={income.source}
                                                onChange={(e) =>
                                                    updateIncome(
                                                        income.id,
                                                        'source',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Company Name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Amount *</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={income.amount}
                                                onChange={(e) =>
                                                    updateIncome(
                                                        income.id,
                                                        'amount',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="5000"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Currency</Label>
                                            <Select
                                                value={income.currency}
                                                onValueChange={(v) =>
                                                    updateIncome(
                                                        income.id,
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
                                            <Label>Frequency *</Label>
                                            <Select
                                                value={income.frequency}
                                                onValueChange={(v) =>
                                                    updateIncome(
                                                        income.id,
                                                        'frequency',
                                                        v,
                                                    )
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
                                            <Label>Payment Day</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={income.payment_day}
                                                onChange={(e) =>
                                                    updateIncome(
                                                        income.id,
                                                        'payment_day',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Start Date *</Label>
                                            <Input
                                                type="date"
                                                value={income.start_date}
                                                onChange={(e) =>
                                                    updateIncome(
                                                        income.id,
                                                        'start_date',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Deposit Account</Label>
                                            <Select
                                                value={
                                                    income.to_account_id ||
                                                    '__none__'
                                                }
                                                onValueChange={(v) =>
                                                    updateIncome(
                                                        income.id,
                                                        'to_account_id',
                                                        v === '__none__'
                                                            ? ''
                                                            : v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">
                                                        Not specified
                                                    </SelectItem>
                                                    {accounts.map((acc) => (
                                                        <SelectItem
                                                            key={acc.id}
                                                            value={acc.id.toString()}
                                                        >
                                                            {acc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {categories.length > 0 && (
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <Select
                                                    value={
                                                        income.category_id ||
                                                        '__none__'
                                                    }
                                                    onValueChange={(v) =>
                                                        updateIncome(
                                                            income.id,
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
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addIncome}
                                className="w-full"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Another Income Source
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
                        {incomes.length > 0 && (
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
