import { AmountInput } from '@/components/finance/amount-input';
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
import { Building2 } from 'lucide-react';
import { useState } from 'react';

interface BankAccountStepProps {
    onSubmit: (data: Record<string, unknown>) => Promise<void>;
    isSubmitting: boolean;
}

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

export default function BankAccountStep({
    onSubmit,
    isSubmitting,
}: BankAccountStepProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<'checking' | 'savings'>('checking');
    const [balance, setBalance] = useState(0);
    const [currency, setCurrency] = useState('CHF');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [color, setColor] = useState(colorOptions[0]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!name.trim()) {
            setErrors({ name: 'Account name is required' });
            return;
        }

        await onSubmit({
            name,
            type,
            balance,
            currency,
            bank_name: bankName || null,
            account_number: accountNumber || null,
            color,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Create Your Bank Account
                </CardTitle>
                <CardDescription>
                    Add your primary bank account to start tracking your
                    finances
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="balance">Opening Balance *</Label>
                            <AmountInput
                                name="balance"
                                value={balance}
                                onChange={setBalance}
                                currency={currency}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                This will create an opening balance transaction
                            </p>
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
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank_name">Bank Name</Label>
                            <Input
                                id="bank_name"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="UBS, Credit Suisse, etc."
                            />
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
                                                ? '3px solid currentColor'
                                                : '2px solid transparent',
                                    }}
                                    onClick={() => setColor(colorOption)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border p-4">
                        <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                            Preview
                        </h4>
                        <div className="flex items-center gap-4">
                            <div
                                className="flex h-14 w-14 items-center justify-center rounded-xl"
                                style={{ backgroundColor: color }}
                            >
                                <Building2 className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">
                                    {name || 'Account Name'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {bankName || 'Bank Name'} &bull; {type}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    >
                        {isSubmitting
                            ? 'Creating...'
                            : 'Create Account & Continue'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
