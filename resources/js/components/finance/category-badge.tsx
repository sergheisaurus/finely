import { Badge } from '@/components/ui/badge';
import type { Category } from '@/types/finance';
import * as Icons from 'lucide-react';

interface CategoryBadgeProps {
    category: Category;
    showIcon?: boolean;
    className?: string;
}

export function CategoryBadge({
    category,
    showIcon = true,
    className,
}: CategoryBadgeProps) {
    const Icon = category.icon
        ? (Icons[category.icon as keyof typeof Icons] as React.ElementType)
        : null;

    return (
        <Badge
            variant="outline"
            className={className}
            style={{ borderColor: category.color, color: category.color }}
        >
            {showIcon && Icon && <Icon className="mr-1 h-3 w-3" />}
            {category.parent && `${category.parent.name} > `}
            {category.name}
        </Badge>
    );
}
