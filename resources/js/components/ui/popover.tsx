import * as React from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';

import { cn } from '@/lib/utils';

const Popover = BasePopover.Root;

function PopoverTrigger({
    asChild,
    children,
    ...props
}: React.ComponentProps<typeof BasePopover.Trigger> & { asChild?: boolean }) {
    if (asChild && React.isValidElement(children)) {
        return <BasePopover.Trigger render={children} {...props} />;
    }

    return <BasePopover.Trigger {...props}>{children}</BasePopover.Trigger>;
}

const PopoverAnchor = React.Fragment;

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof BasePopover.Popup>,
    React.ComponentPropsWithoutRef<typeof BasePopover.Popup> & {
        align?: 'start' | 'center' | 'end';
        sideOffset?: number;
    }
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
    <BasePopover.Portal>
        <BasePopover.Positioner align={align} sideOffset={sideOffset}>
            <BasePopover.Popup
                ref={ref}
                className={cn(
                    'z-[80] w-72 rounded-md border border-border/70 bg-popover p-4 text-popover-foreground shadow-xl outline-none transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
                    className,
                )}
                {...props}
            />
        </BasePopover.Positioner>
    </BasePopover.Portal>
));
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
