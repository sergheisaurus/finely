import { Badge } from '@/components/ui/badge';
import type { Card } from '@/types/finance';
import { CreditCard } from 'lucide-react';

interface CardBadgeProps {
    card: Card;
    className?: string;
}

export function CardBadge({ card, className }: CardBadgeProps) {
    const lastFour = card.card_number ? card.card_number.slice(-4) : '••••';

    return (
        <Badge
            variant="outline"
            className={className}
            style={{ borderColor: card.color, color: card.color }}
        >
            <CreditCard className="mr-1.5 h-3 w-3" />
            <span className="max-w-[150px] truncate">
                {card.card_holder_name} •••• {lastFour}
            </span>
        </Badge>
    );
}
