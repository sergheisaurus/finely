import { AccountBadge } from '@/components/finance/account-badge';
import { CategoryBadge } from '@/components/finance/category-badge';
import { MerchantBadge } from '@/components/finance/merchant-badge';
import { TransactionTypeBadge } from '@/components/finance/transaction-type-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Transaction } from '@/types/finance';
import { ArrowRight, Edit, FileText, Trash2 } from 'lucide-react';

interface TransactionItemProps {
    transaction: Transaction;
    onClick?: () => void;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
}

export function TransactionItem({ transaction, onClick, onEdit, onDelete }: TransactionItemProps) {
    const isIncome = transaction.type === 'income';
    const isExpense = transaction.type === 'expense';
    const isTransfer = transaction.type === 'transfer';

    return (
        <div
            className={`flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {/* Date */}
            <div className="flex flex-col items-center">
                <span className="text-sm font-medium">
                    {new Date(transaction.transaction_date).getDate()}
                </span>
                <span className="text-xs text-muted-foreground">
                    {new Date(transaction.transaction_date).toLocaleDateString(
                        'en-US',
                        { month: 'short' },
                    )}
                </span>
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{transaction.title}</h4>
                    <TransactionTypeBadge type={transaction.type} />
                </div>

                {transaction.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                        {transaction.description}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-sm">
                    {transaction.category && (
                        <CategoryBadge category={transaction.category} />
                    )}
                    {transaction.merchant && (
                        <MerchantBadge merchant={transaction.merchant} />
                    )}

                    {/* Show accounts/cards involved */}
                    {isTransfer && transaction.from_account && transaction.to_account && (
                        <div className="flex items-center gap-1">
                            <AccountBadge account={transaction.from_account} />
                            <ArrowRight className="h-3 w-3" />
                            <AccountBadge account={transaction.to_account} />
                        </div>
                    )}

                    {isExpense && transaction.from_account && (
                        <AccountBadge account={transaction.from_account} />
                    )}

                    {isIncome && transaction.to_account && (
                        <AccountBadge account={transaction.to_account} />
                    )}

                    {transaction.attachments_count && transaction.attachments_count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            {transaction.attachments_count}
                        </span>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className="text-right">
                <p
                    className={`text-lg font-bold ${
                        isIncome
                            ? 'text-green-600 dark:text-green-400'
                            : isExpense
                              ? 'text-red-600 dark:text-red-400'
                              : ''
                    }`}
                >
                    {isIncome ? '+' : isExpense ? '-' : ''}
                    {formatCurrency(transaction.amount, transaction.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.transaction_date)}
                </p>
            </div>

            {/* Actions */}
            {(onEdit || onDelete) && (
                <div className="flex gap-1">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(transaction);
                            }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(transaction);
                            }}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
