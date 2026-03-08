import { AccountBadge } from '@/components/finance/account-badge';
import { CardBadge } from '@/components/finance/card-badge';
import { CategoryBadge } from '@/components/finance/category-badge';
import { MerchantBadge } from '@/components/finance/merchant-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/types/finance';
import { Edit, Layers3, Trash2 } from 'lucide-react';

interface TransactionSplitGroupItemProps {
    transactions: Transaction[];
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
}

export function TransactionSplitGroupItem({
    transactions,
    onEdit,
    onDelete,
}: TransactionSplitGroupItemProps) {
    const orderedTransactions = [...transactions].sort(
        (a, b) =>
            (a.metadata?.split?.index ?? 1) - (b.metadata?.split?.index ?? 1),
    );
    const primaryTransaction = orderedTransactions[0];
    const totalAmount =
        primaryTransaction.metadata?.split?.total_amount ??
        orderedTransactions.reduce((sum, item) => sum + item.amount, 0);
    const splitCount =
        primaryTransaction.metadata?.split?.count ?? orderedTransactions.length;

    return (
        <div className="space-y-3 p-4 transition-colors hover:bg-accent/35">
            <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium">
                        {new Date(
                            primaryTransaction.transaction_date,
                        ).getDate()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {new Date(
                            primaryTransaction.transaction_date,
                        ).toLocaleDateString('en-US', {
                            month: 'short',
                        })}
                    </span>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <Layers3 className="h-4 w-4 text-amber-500" />
                            <h4 className="truncate font-semibold">
                                {primaryTransaction.title}
                            </h4>
                        </div>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-300">
                            Split into {splitCount} rows
                        </span>
                    </div>

                    {primaryTransaction.description && (
                        <p className="line-clamp-1 text-sm text-muted-foreground">
                            {primaryTransaction.description}
                        </p>
                    )}

                    {primaryTransaction.merchant && (
                        <MerchantBadge merchant={primaryTransaction.merchant} />
                    )}

                    <div className="space-y-2 rounded-lg border border-border/70 bg-background/60 p-3">
                        {orderedTransactions.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-sm"
                            >
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    {item.category && (
                                        <CategoryBadge
                                            category={item.category}
                                        />
                                    )}
                                    {item.type === 'expense' &&
                                        item.from_account && (
                                            <AccountBadge
                                                account={item.from_account}
                                            />
                                        )}
                                    {item.type === 'expense' &&
                                        item.from_card && (
                                            <CardBadge card={item.from_card} />
                                        )}
                                    {item.type === 'income' &&
                                        item.to_account && (
                                            <AccountBadge
                                                account={item.to_account}
                                            />
                                        )}
                                    {item.type === 'income' && item.to_card && (
                                        <CardBadge card={item.to_card} />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'font-semibold',
                                        item.type === 'income'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400',
                                    )}
                                >
                                    {item.type === 'income' ? '+' : '-'}
                                    {formatCurrency(item.amount, item.currency)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-right">
                    <p
                        className={cn(
                            'text-lg font-bold',
                            primaryTransaction.type === 'income'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400',
                        )}
                    >
                        {primaryTransaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(
                            totalAmount,
                            primaryTransaction.currency,
                        )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatDate(primaryTransaction.transaction_date)}
                    </p>
                </div>

                {(onEdit || onDelete) && (
                    <div className="flex gap-1">
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(primaryTransaction)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(primaryTransaction)}
                            >
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
