import * as React from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type SelectProps<T extends string = string> = Omit<
    React.ComponentProps<typeof BaseSelect.Root>,
    'value' | 'defaultValue' | 'onValueChange'
> & {
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
};

function Select<T extends string = string>({
    value,
    defaultValue,
    onValueChange,
    ...props
}: SelectProps<T>) {
    return (
        <BaseSelect.Root
            data-slot="select"
            value={value ?? null}
            defaultValue={defaultValue ?? null}
            onValueChange={(nextValue) =>
                onValueChange?.((nextValue ?? '') as T)
            }
            {...props}
        />
    );
}

function SelectGroup({
    ...props
}: React.ComponentProps<typeof BaseSelect.Group>) {
    return <BaseSelect.Group data-slot="select-group" {...props} />;
}

function SelectValue({
    ...props
}: React.ComponentProps<typeof BaseSelect.Value>) {
    return <BaseSelect.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
    className,
    children,
    ...props
}: React.ComponentProps<typeof BaseSelect.Trigger>) {
    return (
        <BaseSelect.Trigger
            data-slot="select-trigger"
            className={cn(
                'flex h-10 w-full items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors data-[placeholder]:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
                className,
            )}
            {...props}
        >
            {children}
            <BaseSelect.Icon>
                <ChevronDownIcon className="size-4 opacity-50" />
            </BaseSelect.Icon>
        </BaseSelect.Trigger>
    );
}

function SelectContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof BaseSelect.Popup> & { position?: 'popper' | 'item-aligned' }) {
    const { position, ...contentProps } = props;
    void position;

    return (
        <BaseSelect.Portal>
            <BaseSelect.Positioner sideOffset={6}>
                <BaseSelect.Popup
                    data-slot="select-content"
                    className={cn(
                        'z-[80] max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-xl transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
                        className,
                    )}
                    {...contentProps}
                >
                    <SelectScrollUpButton />
                    <BaseSelect.List className="p-1">{children}</BaseSelect.List>
                    <SelectScrollDownButton />
                </BaseSelect.Popup>
            </BaseSelect.Positioner>
        </BaseSelect.Portal>
    );
}

function SelectLabel({
    className,
    ...props
}: React.ComponentProps<typeof BaseSelect.GroupLabel>) {
    return (
        <BaseSelect.GroupLabel
            data-slot="select-label"
            className={cn('px-2 py-1.5 text-sm font-medium', className)}
            {...props}
        />
    );
}

function SelectItem({
    className,
    children,
    ...props
}: Omit<React.ComponentProps<typeof BaseSelect.Item>, 'value'> & {
    value: string;
}) {
    return (
        <BaseSelect.Item
            data-slot="select-item"
            className={cn(
                'relative flex w-full select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
                className,
            )}
            {...props}
        >
            <span className="absolute right-2 flex size-3.5 items-center justify-center">
                <BaseSelect.ItemIndicator>
                    <CheckIcon className="size-4" />
                </BaseSelect.ItemIndicator>
            </span>
            <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
        </BaseSelect.Item>
    );
}

function SelectSeparator({
    className,
    ...props
}: React.ComponentProps<typeof BaseSelect.Separator>) {
    return (
        <BaseSelect.Separator
            data-slot="select-separator"
            className={cn('-mx-1 my-1 h-px bg-border pointer-events-none', className)}
            {...props}
        />
    );
}

function SelectScrollUpButton({
    className,
    ...props
}: React.ComponentProps<typeof BaseSelect.ScrollUpArrow>) {
    return (
        <BaseSelect.ScrollUpArrow
            data-slot="select-scroll-up-button"
            className={cn('flex items-center justify-center py-1', className)}
            {...props}
        >
            <ChevronUpIcon className="size-4" />
        </BaseSelect.ScrollUpArrow>
    );
}

function SelectScrollDownButton({
    className,
    ...props
}: React.ComponentProps<typeof BaseSelect.ScrollDownArrow>) {
    return (
        <BaseSelect.ScrollDownArrow
            data-slot="select-scroll-down-button"
            className={cn('flex items-center justify-center py-1', className)}
            {...props}
        >
            <ChevronDownIcon className="size-4" />
        </BaseSelect.ScrollDownArrow>
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};
