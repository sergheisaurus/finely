import * as React from 'react';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';

function Collapsible({
    ...props
}: React.ComponentProps<typeof BaseCollapsible.Root>) {
    return <BaseCollapsible.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
    asChild,
    children,
    ...props
}: React.ComponentProps<typeof BaseCollapsible.Trigger> & {
    asChild?: boolean;
}) {
    if (asChild && React.isValidElement(children)) {
        return (
            <BaseCollapsible.Trigger
                data-slot="collapsible-trigger"
                render={children}
                {...props}
            />
        );
    }

    return (
        <BaseCollapsible.Trigger data-slot="collapsible-trigger" {...props}>
            {children}
        </BaseCollapsible.Trigger>
    );
}

function CollapsibleContent({
    ...props
}: React.ComponentProps<typeof BaseCollapsible.Panel>) {
    return <BaseCollapsible.Panel data-slot="collapsible-content" {...props} />;
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
