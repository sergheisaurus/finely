import { AccountBadge } from '@/components/finance/account-badge';
import { CardBadge } from '@/components/finance/card-badge';
import { CategoryBadge } from '@/components/finance/category-badge';
import { MerchantBadge } from '@/components/finance/merchant-badge';
import { TransactionBalanceSnapshots } from '@/components/finance/transaction-balance-snapshots';
import { TransactionTypeBadge } from '@/components/finance/transaction-type-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import { useSecretStore } from '@/stores/useSecretStore';
import type { Transaction } from '@/types/finance';
import { ArrowRight, Edit, EyeOff, FileText, Lock, Trash2 } from 'lucide-react';

interface TransactionItemProps {
    transaction: Transaction;
    onClick?: () => void;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
}

export function TransactionItem({
    transaction,
    onClick,
    onEdit,
    onDelete,
}: TransactionItemProps) {
    const isIncome = transaction.type === 'income';
    const isExpense = transaction.type === 'expense';
    const isTransfer = transaction.type === 'transfer';
    const isCardPayment = transaction.type === 'card_payment';

    const { isSecretModeActive } = useSecretStore();
    const hasSecretDetails = !!(
        transaction.secret_title ||
        transaction.secret_category_id ||
        transaction.secret_merchant_id
    );

    return (
        <div
            className={`flex items-center gap-4 p-4 transition-colors hover:bg-accent/35 ${onClick ? 'cursor-pointer' : ''} ${isSecretModeActive && hasSecretDetails ? 'bg-fuchsia-500/5' : ''}`}
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
                    <h4 className="flex items-center gap-1.5 font-semibold">
                        {transaction.title}
                        {hasSecretDetails &&
                            (isSecretModeActive ? (
                                <Lock className="h-3.5 w-3.5 text-fuchsia-400" />
                            ) : (
                                <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
                            ))}
                    </h4>
                    <TransactionTypeBadge type={transaction.type} />
                </div>

                {transaction.description && (
                    <p className="line-clamp-1 text-sm text-muted-foreground">
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
                    {isTransfer &&
                        transaction.from_account &&
                        transaction.to_account && (
                            <div className="flex items-center gap-1">
                                <AccountBadge
                                    account={transaction.from_account}
                                />
                                <ArrowRight className="h-3 w-3" />
                                <AccountBadge
                                    account={transaction.to_account}
                                />
                            </div>
                        )}

                    {isCardPayment &&
                        transaction.from_account &&
                        transaction.to_card && (
                            <div className="flex items-center gap-1">
                                <AccountBadge
                                    account={transaction.from_account}
                                />
                                <ArrowRight className="h-3 w-3" />
                                <CardBadge card={transaction.to_card} />
                            </div>
                        )}

                    {isExpense && (
                        <>
                            {transaction.from_account && (
                                <AccountBadge
                                    account={transaction.from_account}
                                />
                            )}
                            {transaction.from_card && (
                                <CardBadge card={transaction.from_card} />
                            )}
                        </>
                    )}

                    {isIncome && (
                        <>
                            {transaction.to_account && (
                                <AccountBadge
                                    account={transaction.to_account}
                                />
                            )}
                            {transaction.to_card && (
                                <CardBadge card={transaction.to_card} />
                            )}
                        </>
                    )}

                    {transaction.attachments_count &&
                        transaction.attachments_count > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                {transaction.attachments_count}
                            </span>
                        )}
                </div>

                <TransactionBalanceSnapshots
                    snapshots={transaction.balance_snapshots}
                />
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
