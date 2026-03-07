import { SalaryBreakdown } from '@/components/finance/salary-breakdown';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Transaction } from '@/types/finance';

interface TransactionDeductionsModalProps {
    transaction: Transaction | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TransactionDeductionsModal({
    transaction,
    open,
    onOpenChange,
}: TransactionDeductionsModalProps) {
    if (!transaction) return null;

    const breakdown = transaction.metadata?.salary_breakdown;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{transaction.title}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {formatDate(transaction.transaction_date)}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {breakdown ? (
                        <SalaryBreakdown
                            breakdown={breakdown}
                            currency={transaction.currency}
                        />
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-sm text-muted-foreground">
                                No salary breakdown recorded for this
                                transaction.
                            </p>
                            <p className="mt-2 text-lg font-bold text-green-600">
                                +
                                {formatCurrency(
                                    transaction.amount,
                                    transaction.currency,
                                )}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
