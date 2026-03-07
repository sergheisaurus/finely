import { formatCurrency } from '@/lib/format';
import type { SalaryBreakdownMetadata } from '@/types/finance';
import { ArrowDown, ArrowUp, Minus, Plus } from 'lucide-react';

interface SalaryBreakdownProps {
    breakdown: SalaryBreakdownMetadata;
    currency: string;
}

export function SalaryBreakdown({ breakdown, currency }: SalaryBreakdownProps) {
    return (
        <div className="space-y-3">
            {/* Gross */}
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Gross Salary</span>
                </div>
                <span className="font-semibold text-emerald-600">
                    {formatCurrency(breakdown.gross_amount, currency)}
                </span>
            </div>

            {/* Additions */}
            {breakdown.additions?.map((addition, index) => (
                <div
                    key={`add-${index}`}
                    className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2"
                >
                    <div className="flex items-center gap-2">
                        <Plus className="h-3 w-3 text-emerald-500" />
                        <span className="flex gap-1 text-sm text-muted-foreground">
                            {addition.name}
                            {addition.type === 'percentage' && (
                                <span className="text-xs text-muted-foreground/50">
                                    ({addition.value}%)
                                </span>
                            )}
                        </span>
                    </div>
                    <span className="text-sm font-medium text-emerald-500">
                        +{formatCurrency(addition.amount, currency)}
                    </span>
                </div>
            ))}

            {/* Total Additions */}
            {(breakdown.additions?.length ?? 0) > 0 && (
                <div className="flex items-center justify-between border-t border-emerald-500/10 pt-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        Total Additions
                    </span>
                    <span className="text-sm font-semibold text-emerald-500">
                        +
                        {formatCurrency(
                            breakdown.total_additions || 0,
                            currency,
                        )}
                    </span>
                </div>
            )}

            {/* Deductions */}
            {breakdown.deductions?.map((deduction, index) => (
                <div
                    key={`ded-${index}`}
                    className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2"
                >
                    <div className="flex items-center gap-2">
                        <Minus className="h-3 w-3 text-red-500" />
                        <span className="flex gap-1 text-sm text-muted-foreground">
                            {deduction.name}
                            {deduction.type === 'percentage' && (
                                <span className="text-xs text-muted-foreground/50">
                                    ({deduction.value}%)
                                </span>
                            )}
                        </span>
                    </div>
                    <span className="text-sm font-medium text-red-500">
                        -{formatCurrency(deduction.amount, currency)}
                    </span>
                </div>
            ))}

            {/* Total Deductions */}
            {(breakdown.deductions?.length ?? 0) > 0 && (
                <div className="flex items-center justify-between border-t border-red-500/10 pt-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        Total Deductions
                    </span>
                    <span className="text-sm font-semibold text-red-500">
                        -{formatCurrency(breakdown.total_deductions, currency)}
                    </span>
                </div>
            )}

            {/* Net */}
            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-bold">Net Amount</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(breakdown.net_amount, currency)}
                </span>
            </div>
        </div>
    );
}
