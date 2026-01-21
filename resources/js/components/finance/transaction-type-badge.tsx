import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/types/finance';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Repeat } from 'lucide-react';

interface TransactionTypeBadgeProps {
    type: Transaction['type'];
    className?: string;
}

export function TransactionTypeBadge({
    type,
    className,
}: TransactionTypeBadgeProps) {
    const config = {
        income: {
            label: 'Income',
            icon: ArrowDownLeft,
            variant: 'default' as const,
            className:
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        },
        expense: {
            label: 'Expense',
            icon: ArrowUpRight,
            variant: 'default' as const,
            className:
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        },
        transfer: {
            label: 'Transfer',
            icon: Repeat,
            variant: 'secondary' as const,
            className:
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        },
        card_payment: {
            label: 'Card Payment',
            icon: CreditCard,
            variant: 'secondary' as const,
            className:
                'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        },
    };

    const { label, icon: Icon, className: badgeClass } = config[type];

    return (
        <Badge variant="outline" className={`${badgeClass} ${className}`}>
            <Icon className="mr-1 h-3 w-3" />
            {label}
        </Badge>
    );
}
