import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

import { cn } from '@/lib/utils';

function TooltipProvider({
    delayDuration = 0,
    ...props
}: React.ComponentProps<typeof BaseTooltip.Provider> & {
    delayDuration?: number;
}) {
    return (
        <BaseTooltip.Provider
            data-slot="tooltip-provider"
            delay={delayDuration}
            {...props}
        />
    );
}

function Tooltip({ ...props }: React.ComponentProps<typeof BaseTooltip.Root>) {
    return (
        <TooltipProvider>
            <BaseTooltip.Root data-slot="tooltip" {...props} />
        </TooltipProvider>
    );
}

function TooltipTrigger({
    asChild,
    children,
    ...props
}: React.ComponentProps<typeof BaseTooltip.Trigger> & { asChild?: boolean }) {
    if (asChild && React.isValidElement(children)) {
        return (
            <BaseTooltip.Trigger
                data-slot="tooltip-trigger"
                render={children}
                {...props}
            />
        );
    }

    return (
        <BaseTooltip.Trigger data-slot="tooltip-trigger" {...props}>
            {children}
        </BaseTooltip.Trigger>
    );
}

function TooltipContent({
    className,
    sideOffset = 4,
    side = 'top',
    align = 'center',
    children,
    ...props
}: React.ComponentProps<typeof BaseTooltip.Popup> & {
    sideOffset?: number;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
}) {
    return (
        <BaseTooltip.Portal>
            <BaseTooltip.Positioner
                sideOffset={sideOffset}
                side={side}
                align={align}
            >
                <BaseTooltip.Popup
                    data-slot="tooltip-content"
                    className={cn(
                        'z-50 max-w-sm rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
                        className,
                    )}
                    {...props}
                >
                    {children}
                    <BaseTooltip.Arrow className="size-2.5 rotate-45 rounded-[2px] bg-primary" />
                </BaseTooltip.Popup>
            </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
    );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
