import { getIconByName } from '@/components/ui/icon-picker';
import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';

interface DynamicIconProps {
    name?: string | null;
    fallback: LucideIcon;
    className?: string;
}

export function DynamicIcon({ name, fallback, className }: DynamicIconProps) {
    const Icon = name ? getIconByName(name) : null;
    return createElement(Icon || fallback, { className });
}
