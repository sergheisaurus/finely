import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Switch } from '@/components/ui/switch';
import {
    calculateExpectedNetFromRules,
    createPercentDeductionRule,
    normalizeSalaryDeductionRules,
} from '@/lib/salary-deductions';
import type { RecurringIncome, SalaryDeductionRule } from '@/types/finance';
import { useEffect, useMemo, useState } from 'react';

function getInitialIncomeReceivedState(income: RecurringIncome | null) {
    return {
        receivedDate: new Date().toISOString().slice(0, 10),
        amount: income ? income.amount.toFixed(2) : '',
        grossAmount: income?.gross_amount
            ? Number(income.gross_amount).toFixed(2)
            : '',
        deductionRules: normalizeSalaryDeductionRules(
            income?.deduction_rules || [],
        ),
        keepAsDefault: false,
    };
}

type Props = {
    income: RecurringIncome | null;
    open: boolean;
    submitting?: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (payload: {
        received_date: string;
        amount: number;
        gross_amount?: number;
        deduction_rules?: SalaryDeductionRule[];
        keep_as_default: boolean;
    }) => void;
};

export function IncomeReceivedDialog({
    income,
    open,
    submitting = false,
    onOpenChange,
    onSubmit,
}: Props) {
    const [receivedDate, setReceivedDate] = useState('');
    const [amount, setAmount] = useState('');
    const [grossAmount, setGrossAmount] = useState('');
    const [deductionRules, setDeductionRules] = useState<SalaryDeductionRule[]>(
        [],
    );
    const [keepAsDefault, setKeepAsDefault] = useState(false);

    useEffect(() => {
        if (!income || !open) {
            return;
        }

        const timeout = window.setTimeout(() => {
            const initialState = getInitialIncomeReceivedState(income);

            setReceivedDate(initialState.receivedDate);
            setAmount(initialState.amount);
            setGrossAmount(initialState.grossAmount);
            setDeductionRules(initialState.deductionRules);
            setKeepAsDefault(initialState.keepAsDefault);
        }, 0);

        return () => window.clearTimeout(timeout);
    }, [income, open]);

    const expectedNet = useMemo(() => {
        const gross = Number(grossAmount || 0);
        if (!gross || deductionRules.length === 0) return null;
        return calculateExpectedNetFromRules(gross, deductionRules);
    }, [grossAmount, deductionRules]);

    if (!income) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Confirm Received Income</DialogTitle>
                    <DialogDescription>
                        Review the received amount before recording it in the
                        journal.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="received-date">Received date</Label>
                            <Input
                                id="received-date"
                                type="date"
                                value={receivedDate}
                                onChange={(e) =>
                                    setReceivedDate(e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="received-amount">
                                Received amount ({income.currency})
                            </Label>
                            <Input
                                id="received-amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    {income.is_salary && (
                        <div className="space-y-4 rounded-lg border p-4">
                            <p className="text-sm font-medium">
                                Salary Breakdown
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="gross-amount">
                                        Gross salary ({income.currency})
                                    </Label>
                                    <Input
                                        id="gross-amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={grossAmount}
                                        onChange={(e) =>
                                            setGrossAmount(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expected net</Label>
                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                                        {expectedNet !== null
                                            ? `${expectedNet.toFixed(2)} ${income.currency}`
                                            : '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Deductions</Label>
                                <div className="space-y-2">
                                    {deductionRules.map((rule, idx) => (
                                        <div
                                            key={`${rule.name}-${idx}`}
                                            className="grid grid-cols-12 gap-2"
                                        >
                                            <Input
                                                className="col-span-6"
                                                value={rule.name}
                                                onChange={(e) => {
                                                    const next = [
                                                        ...deductionRules,
                                                    ];
                                                    next[idx] = {
                                                        ...next[idx],
                                                        name: e.target.value,
                                                    };
                                                    setDeductionRules(next);
                                                }}
                                                placeholder="AHV/AVS"
                                            />
                                            <Select
                                                value={rule.type || 'percent'}
                                                onValueChange={(value) => {
                                                    const next = [
                                                        ...deductionRules,
                                                    ];
                                                    next[idx] = {
                                                        ...next[idx],
                                                        type: value as
                                                            | 'percent'
                                                            | 'fixed',
                                                        percent:
                                                            value === 'percent'
                                                                ? Number(
                                                                      next[idx]
                                                                          .percent ||
                                                                          0,
                                                                  )
                                                                : 0,
                                                        fixed_amount:
                                                            value === 'fixed'
                                                                ? Number(
                                                                      next[idx]
                                                                          .fixed_amount ||
                                                                          0,
                                                                  )
                                                                : 0,
                                                    };
                                                    setDeductionRules(next);
                                                }}
                                            >
                                                <SelectTrigger className="col-span-2">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percent">
                                                        %
                                                    </SelectItem>
                                                    <SelectItem value="fixed">
                                                        Fixed
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                className="col-span-3"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                max={
                                                    rule.type === 'fixed'
                                                        ? undefined
                                                        : '100'
                                                }
                                                value={
                                                    rule.type === 'fixed'
                                                        ? Number(
                                                              rule.fixed_amount ||
                                                                  0,
                                                          )
                                                        : Number(
                                                              rule.percent || 0,
                                                          )
                                                }
                                                onChange={(e) => {
                                                    const next = [
                                                        ...deductionRules,
                                                    ];
                                                    if (rule.type === 'fixed') {
                                                        next[idx] = {
                                                            ...next[idx],
                                                            fixed_amount:
                                                                Number(
                                                                    e.target
                                                                        .value ||
                                                                        0,
                                                                ),
                                                        };
                                                    } else {
                                                        next[idx] = {
                                                            ...next[idx],
                                                            percent: Number(
                                                                e.target
                                                                    .value || 0,
                                                            ),
                                                        };
                                                    }
                                                    setDeductionRules(next);
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="col-span-1 px-0"
                                                onClick={() =>
                                                    setDeductionRules((prev) =>
                                                        prev.filter(
                                                            (_, i) => i !== idx,
                                                        ),
                                                    )
                                                }
                                            >
                                                x
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setDeductionRules((prev) => [
                                            ...prev,
                                            createPercentDeductionRule(),
                                        ])
                                    }
                                >
                                    Add deduction
                                </Button>
                            </div>

                            <div className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <p className="text-sm font-medium">
                                        Keep as default
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Save this gross and deduction setup for
                                        future payments.
                                    </p>
                                </div>
                                <Switch
                                    checked={keepAsDefault}
                                    onCheckedChange={setKeepAsDefault}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                            if (!receivedDate || !amount) return;
                            onSubmit({
                                received_date: receivedDate,
                                amount: Number(amount),
                                gross_amount: grossAmount
                                    ? Number(grossAmount)
                                    : undefined,
                                deduction_rules: income.is_salary
                                    ? normalizeSalaryDeductionRules(
                                          deductionRules,
                                      )
                                    : undefined,
                                keep_as_default: keepAsDefault,
                            });
                        }}
                    >
                        {submitting ? 'Saving...' : 'Confirm received'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
