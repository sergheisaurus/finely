import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Dialog({
    ...props
}: React.ComponentProps<typeof BaseDialog.Root>) {
    return <BaseDialog.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
    asChild,
    children,
    ...props
}: React.ComponentProps<typeof BaseDialog.Trigger> & { asChild?: boolean }) {
    if (asChild && React.isValidElement(children)) {
        return (
            <BaseDialog.Trigger
                data-slot="dialog-trigger"
                render={children}
                {...props}
            />
        );
    }

    return (
        <BaseDialog.Trigger data-slot="dialog-trigger" {...props}>
            {children}
        </BaseDialog.Trigger>
    );
}

function DialogPortal({
    ...props
}: React.ComponentProps<typeof BaseDialog.Portal>) {
    return <BaseDialog.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
    asChild,
    children,
    ...props
}: React.ComponentProps<typeof BaseDialog.Close> & { asChild?: boolean }) {
    if (asChild && React.isValidElement(children)) {
        return (
            <BaseDialog.Close
                data-slot="dialog-close"
                render={children}
                {...props}
            />
        );
    }

    return (
        <BaseDialog.Close data-slot="dialog-close" {...props}>
            {children}
        </BaseDialog.Close>
    );
}

function DialogOverlay({
    className,
    ...props
}: React.ComponentProps<typeof BaseDialog.Backdrop>) {
    return (
        <BaseDialog.Backdrop
            data-slot="dialog-overlay"
            className={cn(
                'fixed inset-0 z-50 bg-black/65 backdrop-blur-[1px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
                className,
            )}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof BaseDialog.Popup>) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <div className="fixed inset-0 z-50 grid place-items-center p-4">
                <BaseDialog.Popup
                    data-slot="dialog-content"
                    className={cn(
                        'relative grid w-full max-w-lg gap-4 rounded-2xl border border-border/70 bg-popover p-6 text-popover-foreground shadow-2xl transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
                        className,
                    )}
                    {...props}
                >
                    {children}
                    <BaseDialog.Close className="absolute top-4 right-4 rounded-md p-1 opacity-70 ring-offset-background transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <XIcon className="size-4" />
                        <span className="sr-only">Close</span>
                    </BaseDialog.Close>
                </BaseDialog.Popup>
            </div>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-header"
            className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
            {...props}
        />
    );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
                className,
            )}
            {...props}
        />
    );
}

function DialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof BaseDialog.Title>) {
    return (
        <BaseDialog.Title
            data-slot="dialog-title"
            className={cn('text-lg leading-none font-semibold', className)}
            {...props}
        />
    );
}

function DialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof BaseDialog.Description>) {
    return (
        <BaseDialog.Description
            data-slot="dialog-description"
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
