import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Checkbox({
    className,
    checked,
    onCheckedChange,
    ...props
}: React.ComponentProps<typeof BaseCheckbox.Root> & {
    onCheckedChange?: (checked: boolean) => void;
}) {
    return (
        <BaseCheckbox.Root
            data-slot="checkbox"
            checked={checked}
            onCheckedChange={(nextChecked) => onCheckedChange?.(nextChecked)}
            className={cn(
                'peer border-input data-[checked]:bg-primary data-[checked]:text-primary-foreground data-[checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        >
            <BaseCheckbox.Indicator
                data-slot="checkbox-indicator"
                className="flex items-center justify-center text-current transition-none"
            >
                <CheckIcon className="size-3.5" />
            </BaseCheckbox.Indicator>
        </BaseCheckbox.Root>
    );
}

export { Checkbox };
