import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Sheet({ ...props }: React.ComponentProps<typeof BaseDialog.Root>) {
    return <BaseDialog.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
    asChild,
    children,
    ...props
}: React.ComponentProps<typeof BaseDialog.Trigger> & { asChild?: boolean }) {
    if (asChild && React.isValidElement(children)) {
        return (
            <BaseDialog.Trigger
                data-slot="sheet-trigger"
                render={children}
                {...props}
            />
        );
    }

    return (
        <BaseDialog.Trigger data-slot="sheet-trigger" {...props}>
            {children}
        </BaseDialog.Trigger>
    );
}

function SheetClose({
    asChild,
    children,
    ...props
}: React.ComponentProps<typeof BaseDialog.Close> & { asChild?: boolean }) {
    if (asChild && React.isValidElement(children)) {
        return (
            <BaseDialog.Close
                data-slot="sheet-close"
                render={children}
                {...props}
            />
        );
    }

    return (
        <BaseDialog.Close data-slot="sheet-close" {...props}>
            {children}
        </BaseDialog.Close>
    );
}

function SheetPortal({
    ...props
}: React.ComponentProps<typeof BaseDialog.Portal>) {
    return <BaseDialog.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
    className,
    ...props
}: React.ComponentProps<typeof BaseDialog.Backdrop>) {
    return (
        <BaseDialog.Backdrop
            data-slot="sheet-overlay"
            className={cn(
                'fixed inset-0 z-50 bg-black/70 transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
                className,
            )}
            {...props}
        />
    );
}

function SheetContent({
    className,
    children,
    side = 'right',
    ...props
}: React.ComponentProps<typeof BaseDialog.Popup> & {
    side?: 'top' | 'right' | 'bottom' | 'left';
}) {
    return (
        <SheetPortal>
            <SheetOverlay />
            <BaseDialog.Popup
                data-slot="sheet-content"
                className={cn(
                    'fixed z-50 flex flex-col gap-4 border-border bg-card text-card-foreground shadow-2xl transition-[transform,opacity] duration-300 ease-out',
                    side === 'right' &&
                        'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
                    side === 'left' &&
                        'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
                    side === 'top' &&
                        'inset-x-0 top-0 h-auto border-b data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full',
                    side === 'bottom' &&
                        'inset-x-0 bottom-0 h-auto border-t data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
                    className,
                )}
                {...props}
            >
                {children}
                <BaseDialog.Close className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <XIcon className="size-4" />
                    <span className="sr-only">Close</span>
                </BaseDialog.Close>
            </BaseDialog.Popup>
        </SheetPortal>
    );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sheet-header"
            className={cn('flex flex-col gap-1.5 p-4', className)}
            {...props}
        />
    );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sheet-footer"
            className={cn('mt-auto flex flex-col gap-2 p-4', className)}
            {...props}
        />
    );
}

function SheetTitle({
    className,
    ...props
}: React.ComponentProps<typeof BaseDialog.Title>) {
    return (
        <BaseDialog.Title
            data-slot="sheet-title"
            className={cn('font-semibold text-foreground', className)}
            {...props}
        />
    );
}

function SheetDescription({
    className,
    ...props
}: React.ComponentProps<typeof BaseDialog.Description>) {
    return (
        <BaseDialog.Description
            data-slot="sheet-description"
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

export {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
};
