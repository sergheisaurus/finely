import { AmountInput } from '@/components/finance/amount-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import type { BankAccount } from '@/types/finance';
import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type ValidationErrorResponse = {
    errors?: Record<string, string>;
};

const hasValidationErrors = (
    error: unknown,
): error is { response: { data?: ValidationErrorResponse } } => {
    if (typeof error !== 'object' || error === null) {
        return false;
    }

    const maybeResponse = (error as { response?: unknown }).response;
    if (typeof maybeResponse !== 'object' || maybeResponse === null) {
        return false;
    }

    const maybeData = (maybeResponse as { data?: unknown }).data;
    if (typeof maybeData !== 'object' || maybeData === null) {
        return false;
    }

    return 'errors' in maybeData;
};

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

interface AccountFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account?: BankAccount | null;
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function AccountFormModal({
    open,
    onOpenChange,
    account,
    onSuccess,
    trigger,
}: AccountFormModalProps) {
    const isEdit = !!account;
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [name, setName] = useState('');
    const [type, setType] = useState<'checking' | 'savings'>('checking');
    const [balance, setBalance] = useState('0');
    const [currency, setCurrency] = useState('CHF');
    const [accountNumber, setAccountNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [color, setColor] = useState(colorOptions[0]);
    const [isDefault, setIsDefault] = useState(false);

    useEffect(() => {
        if (open) {
            setName(account?.name || '');
            setType((account?.type as 'checking' | 'savings') || 'checking');
            setBalance(account?.balance?.toString() || '0');
            setCurrency(account?.currency || 'CHF');
            setAccountNumber(account?.account_number || '');
            setBankName(account?.bank_name || '');
            setColor(account?.color || colorOptions[0]);
            setIsDefault(account?.is_default || false);
            setErrors({});
        }
    }, [open, account]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setIsSaving(true);
        setErrors({});

        try {
            const payload = {
                name,
                type,
                balance: parseFloat(balance) || 0,
                currency,
                account_number: accountNumber || null,
                bank_name: bankName || null,
                color,
                is_default: isDefault,
            };

            if (isEdit) {
                await api.patch(`/accounts/${account.id}`, payload);
                toast.success('Account updated successfully!');
            } else {
                await api.post('/accounts', payload);
                toast.success('Account created successfully!');
            }

            onOpenChange(false);
            onSuccess();
        } catch (error: unknown) {
            if (hasValidationErrors(error) && error.response.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to save account:', error);
                toast.error(
                    isEdit
                        ? 'Failed to update account'
                        : 'Failed to create account',
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
                <form onSubmit={handleSave}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit ? 'Edit Account' : 'Create Bank Account'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? 'Update the details for this bank account.'
                                : 'Add a new bank account to track your finances.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Account Name *</Label>
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
                                onValueChange={(
                                    value: 'checking' | 'savings',
                                ) => setType(value)}
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
                            <Label htmlFor="balance">Initial Balance *</Label>
                            <AmountInput
                                name="balance"
                                value={parseFloat(balance) || 0}
                                onChange={(value) =>
                                    setBalance(value.toString())
                                }
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
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
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
                                onChange={(e) => setBankName(e.target.value)}
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

                        <div className="space-y-2 md:col-span-2">
                            <Label>Account Color</Label>
                            <div className="flex flex-wrap gap-2">
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

                        <div className="flex items-center gap-2 md:col-span-2">
                            <input
                                type="checkbox"
                                id="is_default"
                                checked={isDefault}
                                onChange={(e) => setIsDefault(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <Label
                                htmlFor="is_default"
                                className="cursor-pointer"
                            >
                                Set as default account
                            </Label>
                        </div>

                        <div className="rounded-lg border p-4 md:col-span-2">
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
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving
                                ? 'Saving...'
                                : isEdit
                                  ? 'Save Changes'
                                  : 'Create Account'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
