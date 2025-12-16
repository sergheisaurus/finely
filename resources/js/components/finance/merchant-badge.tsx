import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Merchant } from '@/types/finance';
import { Building2, User } from 'lucide-react';

interface MerchantBadgeProps {
    merchant: Merchant;
    showAvatar?: boolean;
    className?: string;
}

export function MerchantBadge({
    merchant,
    showAvatar = true,
    className,
}: MerchantBadgeProps) {
    const Icon = merchant.type === 'company' ? Building2 : User;

    return (
        <Badge variant="outline" className={`gap-1.5 ${className}`}>
            {showAvatar && (
                <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[10px]">
                        <Icon className="h-3 w-3" />
                    </AvatarFallback>
                </Avatar>
            )}
            {merchant.name}
        </Badge>
    );
}
