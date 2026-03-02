import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

function NavigationMenu({
    className,
    children,
    ...props
}: React.ComponentProps<'nav'> & { viewport?: boolean }) {
    return (
        <nav
            data-slot="navigation-menu"
            className={cn(
                'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
                className,
            )}
            {...props}
        >
            {children}
        </nav>
    );
}

function NavigationMenuList({
    className,
    ...props
}: React.ComponentProps<'ul'>) {
    return (
        <ul
            data-slot="navigation-menu-list"
            className={cn(
                'group flex flex-1 list-none items-center justify-center gap-1',
                className,
            )}
            {...props}
        />
    );
}

function NavigationMenuItem({
    className,
    ...props
}: React.ComponentProps<'li'>) {
    return (
        <li
            data-slot="navigation-menu-item"
            className={cn('relative', className)}
            {...props}
        />
    );
}

const navigationMenuTriggerStyle = cva(
    'group inline-flex h-9 w-max items-center justify-center rounded-lg border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:border-border/60 hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-colors',
);

function NavigationMenuTrigger({
    className,
    ...props
}: React.ComponentProps<'button'>) {
    return (
        <button
            data-slot="navigation-menu-trigger"
            className={cn(navigationMenuTriggerStyle(), className)}
            {...props}
        />
    );
}

function NavigationMenuContent({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return <div data-slot="navigation-menu-content" className={cn(className)} {...props} />;
}

function NavigationMenuViewport({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return <div data-slot="navigation-menu-viewport" className={cn(className)} {...props} />;
}

function NavigationMenuLink({
    className,
    ...props
}: React.ComponentProps<'a'>) {
    return <a data-slot="navigation-menu-link" className={cn(className)} {...props} />;
}

function NavigationMenuIndicator({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return <div data-slot="navigation-menu-indicator" className={cn(className)} {...props} />;
}

export {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
    navigationMenuTriggerStyle,
};
