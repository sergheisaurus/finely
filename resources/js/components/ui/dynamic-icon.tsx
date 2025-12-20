import { getIconByName } from '@/components/ui/icon-picker';
import type { LucideIcon } from 'lucide-react';

interface DynamicIconProps {
    name?: string | null;
    fallback: LucideIcon;
    className?: string;
}

export function DynamicIcon({ name, fallback: Fallback, className }: DynamicIconProps) {
    const Icon = name ? getIconByName(name) : null;

    if (Icon) {
        return <Icon className={className} />;
    }

    return <Fallback className={className} />;
}
