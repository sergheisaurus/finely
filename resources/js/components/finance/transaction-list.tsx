import { TransactionItem } from '@/components/finance/transaction-item';
import { TransactionSplitGroupItem } from '@/components/finance/transaction-split-group-item';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction } from '@/types/finance';

interface TransactionListProps {
    transactions: Transaction[];
    isLoading?: boolean;
    onTransactionClick?: (transaction: Transaction) => void;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
    groupSplits?: boolean;
}

export function TransactionList({
    transactions,
    isLoading,
    onTransactionClick,
    onEdit,
    onDelete,
    groupSplits = false,
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

    const groupedTransactions = groupSplits
        ? transactions.reduce<
              Array<
                  | { kind: 'single'; transaction: Transaction }
                  | { kind: 'split'; transactions: Transaction[] }
              >
          >((items, transaction) => {
              const groupId = transaction.metadata?.split?.group_id;

              if (!groupId) {
                  items.push({ kind: 'single', transaction });
                  return items;
              }

              const existingGroup = items.find(
                  (item) =>
                      item.kind === 'split' &&
                      item.transactions[0]?.metadata?.split?.group_id ===
                          groupId,
              );

              if (existingGroup && existingGroup.kind === 'split') {
                  existingGroup.transactions.push(transaction);
                  return items;
              }

              items.push({ kind: 'split', transactions: [transaction] });
              return items;
          }, [])
        : transactions.map((transaction) => ({
              kind: 'single' as const,
              transaction,
          }));

    return (
        <div className="divide-y divide-border/70 rounded-[1.25rem] border border-border/70 bg-background/70">
            {groupedTransactions.map((item) =>
                item.kind === 'split' ? (
                    <TransactionSplitGroupItem
                        key={item.transactions[0]?.metadata?.split?.group_id}
                        transactions={item.transactions}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ) : (
                    <TransactionItem
                        key={item.transaction.id}
                        transaction={item.transaction}
                        onClick={() => onTransactionClick?.(item.transaction)}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ),
            )}
        </div>
    );
}
