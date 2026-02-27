import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SalaryBreakdown } from '@/components/finance/salary-breakdown';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { RecurringIncome, SalaryDeduction } from '@/types/finance';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MarkReceivedModalProps {
    income: RecurringIncome | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function MarkReceivedModal({
    income,
    open,
    onOpenChange,
    onSuccess,
}: MarkReceivedModalProps) {
    const [grossAmount, setGrossAmount] = useState('');
    const [deductions, setDeductions] = useState<SalaryDeduction[]>([]);
    const [saveAsDefault, setSaveAsDefault] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receivedDate, setReceivedDate] = useState('');

    // Initialize the form when the modal opens
    useEffect(() => {
        if (open && income) {
            setGrossAmount(String(income.amount));
            setReceivedDate(new Date().toISOString().split('T')[0]);
            setSaveAsDefault(false);

            // Pre-populate deductions from the income's saved defaults
            if (income.deductions && income.deductions.length > 0) {
                setDeductions(
                    income.deductions.map((d) => ({
                        name: d.name,
                        amount: d.amount,
                    })),
                );
            } else {
                setDeductions([]);
            }
        }
    }, [open, income]);

    if (!income) return null;

    const addDeduction = () => {
        setDeductions([...deductions, { name: '', amount: 0 }]);
    };

    const removeDeduction = (index: number) => {
        setDeductions(deductions.filter((_, i) => i !== index));
    };

    const updateDeduction = (
        index: number,
        field: keyof SalaryDeduction,
        value: string | number,
    ) => {
        const updated = [...deductions];
        if (field === 'name') {
            updated[index] = { ...updated[index], name: value as string };
        } else {
            updated[index] = {
                ...updated[index],
                amount: Number(value) || 0,
            };
        }
        setDeductions(updated);
    };

    const gross = Number(grossAmount) || 0;
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netAmount = gross - totalDeductions;

    const previewBreakdown = {
        gross_amount: gross,
        total_deductions: totalDeductions,
        net_amount: netAmount,
        deductions: deductions.filter((d) => d.name && d.amount > 0),
    };

    const handleSubmit = async () => {
        if (!income) return;
        setIsSubmitting(true);

        try {
            const payload: Record<string, unknown> = {
                amount: gross,
                date: receivedDate,
            };

            if (deductions.length > 0) {
                payload.deductions = deductions.filter(
                    (d) => d.name && d.amount > 0,
                );
                payload.save_deductions = saveAsDefault;
            }

            await api.post(
                `/recurring-incomes/${income.id}/mark-received`,
                payload,
            );

            toast.success('Income marked as received!', {
                description: `Net amount: ${formatCurrency(netAmount, income.currency)}`,
            });

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to mark income as received:', error);
            toast.error('Failed to record income');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Mark "{income.name}" as Received</DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Date */}
                    <div className="space-y-1.5">
                        <Label htmlFor="received-date">Date Received</Label>
                        <Input
                            id="received-date"
                            type="date"
                            value={receivedDate}
                            onChange={(e) => setReceivedDate(e.target.value)}
                        />
                    </div>

                    {/* Gross Amount */}
                    <div className="space-y-1.5">
                        <Label htmlFor="gross-amount">
                            Gross Amount ({income.currency})
                        </Label>
                        <Input
                            id="gross-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={grossAmount}
                            onChange={(e) => setGrossAmount(e.target.value)}
                        />
                    </div>

                    {/* Deductions */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Deductions</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addDeduction}
                            >
                                <Plus className="mr-1 h-3 w-3" />
                                Add
                            </Button>
                        </div>

                        {deductions.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No deductions. Click "Add" to add taxes, social
                                security, etc.
                            </p>
                        )}

                        {deductions.map((deduction, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2"
                            >
                                <Input
                                    placeholder="e.g. Tax"
                                    value={deduction.name}
                                    onChange={(e) =>
                                        updateDeduction(
                                            index,
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={deduction.amount || ''}
                                    onChange={(e) =>
                                        updateDeduction(
                                            index,
                                            'amount',
                                            e.target.value,
                                        )
                                    }
                                    className="w-28"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeDeduction(index)}
                                    className="shrink-0"
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Preview */}
                    {gross > 0 && (
                        <div className="space-y-2">
                            <Label>Preview</Label>
                            <SalaryBreakdown
                                breakdown={previewBreakdown}
                                currency={income.currency}
                            />
                        </div>
                    )}

                    {/* Save as default */}
                    {deductions.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="save-default"
                                checked={saveAsDefault}
                                onCheckedChange={(checked) =>
                                    setSaveAsDefault(checked === true)
                                }
                            />
                            <Label
                                htmlFor="save-default"
                                className="cursor-pointer text-sm"
                            >
                                Save these deductions as default for next time
                            </Label>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || netAmount < 0}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                        {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Confirm ({formatCurrency(netAmount, income.currency)})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
