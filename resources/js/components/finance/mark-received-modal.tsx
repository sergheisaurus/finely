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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { RecurringIncome, SalaryAdjustment } from '@/types/finance';
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
    const [additions, setAdditions] = useState<SalaryAdjustment[]>([]);
    const [deductions, setDeductions] = useState<SalaryAdjustment[]>([]);
    const [saveAsDefault, setSaveAsDefault] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receivedDate, setReceivedDate] = useState('');

    // Initialize the form when the modal opens
    useEffect(() => {
        if (open && income) {
            setGrossAmount(String(income.amount));
            setReceivedDate(new Date().toISOString().split('T')[0]);
            setSaveAsDefault(false);

            const baseGross = Number(income.amount) || 0;
            let tempTotalAdditions = 0;

            if (income.additions && income.additions.length > 0) {
                setAdditions(
                    income.additions.map((a) => {
                        const val =
                            a.value !== undefined && a.value !== null
                                ? a.value
                                : a.amount;
                        const calcAmount =
                            a.type === 'percentage'
                                ? baseGross * ((Number(val) || 0) / 100)
                                : Number(val) || 0;
                        const isOverridden =
                            a.type === 'percentage' &&
                            a.amount !== undefined &&
                            Math.abs(a.amount - calcAmount) > 0.001;
                        tempTotalAdditions += isOverridden
                            ? a.amount
                            : calcAmount;

                        return {
                            name: a.name,
                            amount: a.amount,
                            type: a.type || 'fixed',
                            value: val,
                            is_overridden: isOverridden,
                        };
                    }),
                );
            } else {
                setAdditions([]);
            }

            const grossPlusAdditions = baseGross + tempTotalAdditions;

            if (income.deductions && income.deductions.length > 0) {
                setDeductions(
                    income.deductions.map((d) => {
                        const val =
                            d.value !== undefined && d.value !== null
                                ? d.value
                                : d.amount;
                        const calcAmount =
                            d.type === 'percentage'
                                ? grossPlusAdditions *
                                  ((Number(val) || 0) / 100)
                                : Number(val) || 0;
                        const isOverridden =
                            d.type === 'percentage' &&
                            d.amount !== undefined &&
                            Math.abs(d.amount - calcAmount) > 0.001;

                        return {
                            name: d.name,
                            amount: d.amount,
                            type: d.type || 'fixed',
                            value: val,
                            is_overridden: isOverridden,
                        };
                    }),
                );
            } else {
                setDeductions([]);
            }
        }
    }, [open, income]);

    if (!income) return null;

    const addAdjustment = (isAddition: boolean) => {
        const setter = isAddition ? setAdditions : setDeductions;
        setter((prev) => [
            ...prev,
            {
                name: '',
                amount: 0,
                type: 'fixed',
                value: 0,
                is_overridden: false,
            },
        ]);
    };

    const removeAdjustment = (index: number, isAddition: boolean) => {
        const setter = isAddition ? setAdditions : setDeductions;
        setter((prev) => prev.filter((_, i) => i !== index));
    };

    const updateAdjustment = (
        index: number,
        field: keyof SalaryAdjustment,
        val: string | number,
        isAddition: boolean,
    ) => {
        const setter = isAddition ? setAdditions : setDeductions;

        setter((prev) => {
            const updated = [...prev];
            const item = { ...updated[index] };

            if (field === 'name') {
                item.name = val as string;
            } else if (field === 'type') {
                item.type = val as 'fixed' | 'percentage';
                // Reset value when switching types to avoid massive numbers
                item.value = 0;
                item.is_overridden = false;
            } else if (field === 'value') {
                item.value = Number(val) || 0;
                item.is_overridden = false;
            } else if (field === 'amount') {
                item.amount = Number(val) || 0;
                item.is_overridden = true;
            }

            updated[index] = item;
            return updated;
        });
    };

    const gross = Number(grossAmount) || 0;

    // Recalculate computed amounts whenever gross or values change
    const calculatedAdditions = additions.map((a: SalaryAdjustment) => {
        const calcAmount =
            a.type === 'percentage'
                ? gross * ((a.value || 0) / 100)
                : a.value || 0;
        const amount = a.is_overridden ? a.amount : calcAmount;
        return { ...a, amount, calcAmount };
    });

    const totalAdditions = calculatedAdditions.reduce(
        (sum, a) => sum + a.amount,
        0,
    );
    const grossPlusAdditions = gross + totalAdditions;

    const calculatedDeductions = deductions.map((d: SalaryAdjustment) => {
        const calcAmount =
            d.type === 'percentage'
                ? grossPlusAdditions * ((d.value || 0) / 100)
                : d.value || 0;
        const amount = d.is_overridden ? d.amount : calcAmount;
        return { ...d, amount, calcAmount };
    });
    const totalDeductions = calculatedDeductions.reduce(
        (sum, d) => sum + d.amount,
        0,
    );
    const netAmount = gross + totalAdditions - totalDeductions;

    const handleSubmit = async () => {
        if (!income) return;
        setIsSubmitting(true);

        try {
            const payload: Record<string, unknown> = {
                amount: gross,
                date: receivedDate,
            };

            if (calculatedAdditions.length > 0) {
                payload.additions = calculatedAdditions.filter(
                    (a) => a.name && (a.value || 0) > 0,
                );
            }

            if (calculatedDeductions.length > 0) {
                payload.deductions = calculatedDeductions.filter(
                    (d) => d.name && (d.value || 0) > 0,
                );
            }

            if (
                calculatedAdditions.length > 0 ||
                calculatedDeductions.length > 0
            ) {
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
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
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

                    {/* Base Salary */}
                    <div className="space-y-1.5">
                        <Label htmlFor="gross-amount">
                            Base Salary ({income.currency})
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

                    {/* Fiche de Salaire Layout */}
                    <div className="mt-4 overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm">
                        <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 bg-muted/50 p-3 text-[13px] font-semibold tracking-wider text-muted-foreground uppercase">
                            <div>Description</div>
                            <div className="text-right">Rate / Basis</div>
                            <div className="text-right">Amount</div>
                            <div></div>
                        </div>

                        <div className="space-y-3 p-3">
                            <div className="grid grid-cols-[1fr_120px_120px_40px] items-center gap-2 text-sm">
                                <div className="font-medium">
                                    Salaire de base
                                </div>
                                <div className="text-right text-muted-foreground">
                                    -
                                </div>
                                <div className="text-right font-medium">
                                    {formatCurrency(gross, income.currency)}
                                </div>
                                <div></div>
                            </div>

                            {/* Additions Section */}
                            <div className="pt-2">
                                <div className="mb-2 flex items-center justify-between">
                                    <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Allocations / Prestations
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addAdjustment(true)}
                                        className="h-6 px-2 text-xs"
                                    >
                                        <Plus className="mr-1 h-3 w-3" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {additions.length === 0 && (
                                        <div className="pl-1 text-xs text-muted-foreground italic">
                                            No allocations
                                        </div>
                                    )}
                                    {additions.map((addition, index) => {
                                        const calcAmount =
                                            addition.type === 'percentage'
                                                ? gross *
                                                  ((addition.value || 0) / 100)
                                                : addition.value || 0;
                                        return (
                                            <div
                                                key={`add-${index}`}
                                                className="grid grid-cols-[1fr_120px_120px_40px] items-center gap-2"
                                            >
                                                <Input
                                                    placeholder="e.g. Bonus"
                                                    className="h-8 text-sm"
                                                    value={addition.name}
                                                    onChange={(e) =>
                                                        updateAdjustment(
                                                            index,
                                                            'name',
                                                            e.target.value,
                                                            true,
                                                        )
                                                    }
                                                />
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        step="0.001"
                                                        min="0"
                                                        className="h-8 px-2 text-right text-sm"
                                                        value={
                                                            addition.value || ''
                                                        }
                                                        onChange={(e) =>
                                                            updateAdjustment(
                                                                index,
                                                                'value',
                                                                e.target.value,
                                                                true,
                                                            )
                                                        }
                                                    />
                                                    <Select
                                                        value={
                                                            addition.type ||
                                                            'fixed'
                                                        }
                                                        onValueChange={(val) =>
                                                            updateAdjustment(
                                                                index,
                                                                'type',
                                                                val,
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-[45px] px-1 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="fixed">
                                                                $
                                                            </SelectItem>
                                                            <SelectItem value="percentage">
                                                                %
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="relative flex min-w-[70px] flex-col items-end justify-center pr-1">
                                                    <div className="group flex items-center gap-1">
                                                        <span className="font-medium text-green-600">
                                                            +
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="h-8 w-[80px] border-transparent bg-transparent px-1 text-right text-sm font-medium text-green-600 transition-all hover:border-input focus-visible:border-input focus-visible:bg-background focus-visible:ring-1"
                                                            value={
                                                                addition.amount !==
                                                                    undefined &&
                                                                addition.is_overridden
                                                                    ? addition.amount
                                                                    : calcAmount.toFixed(
                                                                          2,
                                                                      )
                                                            }
                                                            onChange={(e) =>
                                                                updateAdjustment(
                                                                    index,
                                                                    'amount',
                                                                    e.target
                                                                        .value,
                                                                    true,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    {addition.is_overridden && (
                                                        <span className="absolute right-2 -bottom-3 text-[10px] whitespace-nowrap text-muted-foreground">
                                                            Calc:{' '}
                                                            {calcAmount.toFixed(
                                                                2,
                                                            )}{' '}
                                                            (Diff:{' '}
                                                            {(
                                                                addition.amount -
                                                                calcAmount
                                                            ).toFixed(2)}
                                                            )
                                                        </span>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        removeAdjustment(
                                                            index,
                                                            true,
                                                        )
                                                    }
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subtotal: Gross Salary */}
                            <div className="-mx-3 my-3 grid grid-cols-[1fr_120px_120px_40px] items-center gap-2 border-y border-border bg-muted/20 px-3 py-2 text-sm font-bold">
                                <div>Salaire Brut (Gross)</div>
                                <div className="text-right text-muted-foreground">
                                    -
                                </div>
                                <div className="text-right text-green-600">
                                    {formatCurrency(
                                        gross + totalAdditions,
                                        income.currency,
                                    )}
                                </div>
                                <div></div>
                            </div>

                            {/* Deductions Section */}
                            <div className="pt-1">
                                <div className="mb-2 flex items-center justify-between">
                                    <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Cotisations Sociales / Impôts
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addAdjustment(false)}
                                        className="h-6 px-2 text-xs"
                                    >
                                        <Plus className="mr-1 h-3 w-3" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {deductions.length === 0 && (
                                        <div className="pl-1 text-xs text-muted-foreground italic">
                                            No deductions
                                        </div>
                                    )}
                                    {deductions.map((deduction, index) => {
                                        const calcAmount =
                                            deduction.type === 'percentage'
                                                ? gross *
                                                  ((deduction.value || 0) / 100)
                                                : deduction.value || 0;
                                        return (
                                            <div
                                                key={`ded-${index}`}
                                                className="grid grid-cols-[1fr_120px_120px_40px] items-center gap-2"
                                            >
                                                <div className="flex rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring">
                                                    <Select
                                                        onValueChange={(val) =>
                                                            val !== 'custom' &&
                                                            updateAdjustment(
                                                                index,
                                                                'name',
                                                                val,
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-[25px] border-0 bg-transparent px-1 shadow-none focus:ring-0">
                                                            <Plus className="mx-auto h-3 w-3" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="AVS/AI/APG">
                                                                AVS/AI/APG
                                                            </SelectItem>
                                                            <SelectItem value="AC (Chômage)">
                                                                AC (Chômage)
                                                            </SelectItem>
                                                            <SelectItem value="LPP (Prévoyance)">
                                                                LPP (Prévoyance)
                                                            </SelectItem>
                                                            <SelectItem value="LAA (Accident non prof.)">
                                                                LAA (Accident)
                                                            </SelectItem>
                                                            <SelectItem value="IJM (Maladie)">
                                                                IJM (Maladie)
                                                            </SelectItem>
                                                            <SelectItem value="Impôt à la source">
                                                                Impôt à la
                                                                source
                                                            </SelectItem>
                                                            <SelectItem value="custom">
                                                                Custom...
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        placeholder="e.g. AVS, LPP"
                                                        className="h-8 flex-1 rounded-none border-0 text-sm shadow-none focus-visible:ring-0"
                                                        value={deduction.name}
                                                        onChange={(e) =>
                                                            updateAdjustment(
                                                                index,
                                                                'name',
                                                                e.target.value,
                                                                false,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        step="0.001"
                                                        min="0"
                                                        className="h-8 px-2 text-right text-sm"
                                                        value={
                                                            deduction.value ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            updateAdjustment(
                                                                index,
                                                                'value',
                                                                e.target.value,
                                                                false,
                                                            )
                                                        }
                                                    />
                                                    <Select
                                                        value={
                                                            deduction.type ||
                                                            'fixed'
                                                        }
                                                        onValueChange={(val) =>
                                                            updateAdjustment(
                                                                index,
                                                                'type',
                                                                val,
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-[45px] px-1 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="fixed">
                                                                $
                                                            </SelectItem>
                                                            <SelectItem value="percentage">
                                                                %
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="relative flex min-w-[70px] flex-col items-end justify-center pr-1">
                                                    <div className="group flex items-center gap-1">
                                                        <span className="font-medium text-red-600">
                                                            -
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="h-8 w-[80px] border-transparent bg-transparent px-1 text-right text-sm font-medium text-red-600 transition-all hover:border-input focus-visible:border-input focus-visible:bg-background focus-visible:ring-1"
                                                            value={
                                                                deduction.amount !==
                                                                    undefined &&
                                                                deduction.is_overridden
                                                                    ? deduction.amount
                                                                    : calcAmount.toFixed(
                                                                          2,
                                                                      )
                                                            }
                                                            onChange={(e) =>
                                                                updateAdjustment(
                                                                    index,
                                                                    'amount',
                                                                    e.target
                                                                        .value,
                                                                    false,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    {deduction.is_overridden && (
                                                        <span className="absolute right-2 -bottom-3 text-[10px] whitespace-nowrap text-muted-foreground">
                                                            Calc:{' '}
                                                            {calcAmount.toFixed(
                                                                2,
                                                            )}{' '}
                                                            (Diff:{' '}
                                                            {(
                                                                deduction.amount -
                                                                calcAmount
                                                            ).toFixed(2)}
                                                            )
                                                        </span>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        removeAdjustment(
                                                            index,
                                                            false,
                                                        )
                                                    }
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Final Net Salary */}
                            <div className="mt-4 grid grid-cols-[1fr_120px_120px_40px] items-center gap-2 border-t-[3px] border-border pt-3 text-[15px] font-bold">
                                <div>Salaire Net</div>
                                <div className="text-right text-muted-foreground">
                                    -
                                </div>
                                <div className="text-right">
                                    {formatCurrency(netAmount, income.currency)}
                                </div>
                                <div></div>
                            </div>
                        </div>
                    </div>

                    {/* Save as default */}
                    {(additions.length > 0 || deductions.length > 0) && (
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
                                Save these adjustments as default for next time
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
