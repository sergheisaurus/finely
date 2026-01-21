import { Badge } from '@/components/ui/badge';
import type { BankAccount } from '@/types/finance';

interface AccountBadgeProps {
    account: BankAccount;
    showBalance?: boolean;
    className?: string;
}

export function AccountBadge({
    account,
    showBalance = false,
    className,
}: AccountBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={className}
            style={{ borderColor: account.color, color: account.color }}
        >
            <div
                className="mr-1.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: account.color }}
            />
            {account.name}
            {showBalance &&
                ` - ${account.currency} ${account.balance.toFixed(2)}`}
        </Badge>
    );
}
