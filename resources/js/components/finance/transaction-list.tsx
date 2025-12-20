import { TransactionItem } from '@/components/finance/transaction-item';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction } from '@/types/finance';

interface TransactionListProps {
    transactions: Transaction[];
    isLoading?: boolean;
    onTransactionClick?: (transaction: Transaction) => void;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
}

export function TransactionList({
    transactions,
    isLoading,
    onTransactionClick,
    onEdit,
    onDelete,
}: TransactionListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <p className="text-lg font-semibold">No transactions found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Create your first transaction to get started
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {transactions.map((transaction) => (
                <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onClick={() => onTransactionClick?.(transaction)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
