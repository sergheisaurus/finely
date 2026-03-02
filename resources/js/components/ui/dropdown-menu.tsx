import * as React from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function DropdownMenu({ ...props }: React.ComponentProps<typeof BaseMenu.Root>) {
    return <BaseMenu.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
    ...props
}: React.ComponentProps<typeof BaseMenu.Portal>) {
    return <BaseMenu.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
    asChild,
    children,
    ...props
}: React.ComponentProps<typeof BaseMenu.Trigger> & { asChild?: boolean }) {
    if (asChild && React.isValidElement(children)) {
        return (
            <BaseMenu.Trigger
                data-slot="dropdown-menu-trigger"
                render={children}
                {...props}
            />
        );
    }

    return (
        <BaseMenu.Trigger data-slot="dropdown-menu-trigger" {...props}>
            {children}
        </BaseMenu.Trigger>
    );
}

function DropdownMenuContent({
    className,
    sideOffset = 6,
    align = 'start',
    side = 'bottom',
    ...props
}: React.ComponentProps<typeof BaseMenu.Popup> & {
    sideOffset?: number;
    align?: 'start' | 'center' | 'end';
    side?: 'top' | 'bottom' | 'left' | 'right';
}) {
    return (
        <BaseMenu.Portal>
            <BaseMenu.Positioner
                sideOffset={sideOffset}
                align={align}
                side={side}
            >
                <BaseMenu.Popup
                    data-slot="dropdown-menu-content"
                    className={cn(
                        'z-50 min-w-[10rem] overflow-hidden rounded-xl border border-border/70 bg-popover p-1 text-popover-foreground shadow-xl transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
                        className,
                    )}
                    {...props}
                />
            </BaseMenu.Positioner>
        </BaseMenu.Portal>
    );
}

function DropdownMenuGroup({
    ...props
}: React.ComponentProps<typeof BaseMenu.Group>) {
    return <BaseMenu.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
    className,
    inset,
    variant = 'default',
    asChild,
    children,
    ...props
}: React.ComponentProps<typeof BaseMenu.Item> & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
    asChild?: boolean;
}) {
    if (asChild && React.isValidElement(children)) {
        return (
            <BaseMenu.Item
                data-slot="dropdown-menu-item"
                data-inset={inset}
                data-variant={variant}
                className={cn(
                    'relative flex select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive',
                    className,
                )}
                render={children}
                {...props}
            />
        );
    }

    return (
        <BaseMenu.Item
            data-slot="dropdown-menu-item"
            data-inset={inset}
            data-variant={variant}
            className={cn(
                'relative flex select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive',
                className,
            )}
            {...props}
        >
            {children}
        </BaseMenu.Item>
    );
}

function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    ...props
}: React.ComponentProps<typeof BaseMenu.CheckboxItem>) {
    return (
        <BaseMenu.CheckboxItem
            data-slot="dropdown-menu-checkbox-item"
            className={cn(
                'relative flex select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className,
            )}
            checked={checked}
            {...props}
        >
            <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <BaseMenu.CheckboxItemIndicator>
                    <CheckIcon className="size-4" />
                </BaseMenu.CheckboxItemIndicator>
            </span>
            {children}
        </BaseMenu.CheckboxItem>
    );
}

function DropdownMenuRadioGroup({
    ...props
}: React.ComponentProps<typeof BaseMenu.RadioGroup>) {
    return <BaseMenu.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof BaseMenu.RadioItem>) {
    return (
        <BaseMenu.RadioItem
            data-slot="dropdown-menu-radio-item"
            className={cn(
                'relative flex select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className,
            )}
            {...props}
        >
            <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <BaseMenu.RadioItemIndicator>
                    <CircleIcon className="size-2 fill-current" />
                </BaseMenu.RadioItemIndicator>
            </span>
            {children}
        </BaseMenu.RadioItem>
    );
}

function DropdownMenuLabel({
    className,
    inset,
    ...props
}: React.ComponentProps<typeof BaseMenu.GroupLabel> & {
    inset?: boolean;
}) {
    return (
        <BaseMenu.GroupLabel
            data-slot="dropdown-menu-label"
            data-inset={inset}
            className={cn(
                'px-2 py-1.5 text-sm font-semibold text-muted-foreground data-[inset]:pl-8',
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuSeparator({
    className,
    ...props
}: React.ComponentProps<typeof BaseMenu.Separator>) {
    return (
        <BaseMenu.Separator
            data-slot="dropdown-menu-separator"
            className={cn('-mx-1 my-1 h-px bg-border', className)}
            {...props}
        />
    );
}

function DropdownMenuShortcut({
    className,
    ...props
}: React.ComponentProps<'span'>) {
    return (
        <span
            data-slot="dropdown-menu-shortcut"
            className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
            {...props}
        />
    );
}

function DropdownMenuSub({
    ...props
}: React.ComponentProps<typeof BaseMenu.SubmenuRoot>) {
    return <BaseMenu.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: React.ComponentProps<typeof BaseMenu.SubmenuTrigger> & {
    inset?: boolean;
}) {
    return (
        <BaseMenu.SubmenuTrigger
            data-slot="dropdown-menu-sub-trigger"
            data-inset={inset}
            className={cn(
                'flex select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[inset]:pl-8',
                className,
            )}
            {...props}
        >
            {children}
            <ChevronRightIcon className="ml-auto size-4" />
        </BaseMenu.SubmenuTrigger>
    );
}

function DropdownMenuSubContent({
    className,
    ...props
}: React.ComponentProps<typeof BaseMenu.Popup>) {
    return (
        <BaseMenu.Portal>
            <BaseMenu.Positioner sideOffset={6} alignOffset={-4}>
                <BaseMenu.Popup
                    data-slot="dropdown-menu-sub-content"
                    className={cn(
                        'z-50 min-w-[10rem] overflow-hidden rounded-xl border border-border/70 bg-popover p-1 text-popover-foreground shadow-xl transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
                        className,
                    )}
                    {...props}
                />
            </BaseMenu.Positioner>
        </BaseMenu.Portal>
    );
}

export {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
};
