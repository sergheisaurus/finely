import { Badge } from '@/components/ui/badge';

interface AccountTypeBadgeProps {
    type: 'checking' | 'savings';
    className?: string;
}

export function AccountTypeBadge({ type, className }: AccountTypeBadgeProps) {
    const badgeText = type === 'checking' ? 'Checking' : 'Savings';
    const badgeColor =
        type === 'checking'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800';

    return (
        <Badge variant="outline" className={`${badgeColor} ${className}`}>
            {badgeText}
        </Badge>
    );
}
