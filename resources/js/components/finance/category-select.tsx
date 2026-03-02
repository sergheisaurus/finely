import { QuickCreateCategoryModal } from '@/components/finance/quick-create-category-modal';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/finance';
import { Check, ChevronsUpDown, Folder, Plus, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface CategorySelectSpecialOption {
    value: string;
    label: string;
}

interface CategorySelectProps {
    value: string;
    onValueChange: (value: string) => void;
    categories: Category[];
    type?: 'income' | 'expense';
    error?: string;
    placeholder?: string;
    onCategoryCreated?: (category: Category) => void;
    allowCreate?: boolean;
    specialOptions?: CategorySelectSpecialOption[];
    triggerClassName?: string;
    disabled?: boolean;
}

export function CategorySelect({
    value,
    onValueChange,
    categories,
    type,
    error,
    placeholder = 'Select category',
    onCategoryCreated,
    allowCreate = true,
    specialOptions,
    triggerClassName,
    disabled = false,
}: CategorySelectProps) {
    const [open, setOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [locallyCreated, setLocallyCreated] = useState<Category[]>([]);

    const allCategories = useMemo(() => {
        const byId = new Map<number, Category>();
        for (const c of categories) byId.set(c.id, c);
        for (const c of locallyCreated) byId.set(c.id, c);
        return Array.from(byId.values());
    }, [categories, locallyCreated]);

    const selectedSpecial = useMemo(() => {
        return specialOptions?.find((o) => o.value === value);
    }, [specialOptions, value]);

    const categoriesById = useMemo(() => {
        return new Map(allCategories.map((c) => [c.id, c]));
    }, [allCategories]);

    const getParent = useCallback(
        (category: Category) => {
            if (category.parent) return category.parent;
            if (!category.parent_id) return null;
            return categoriesById.get(category.parent_id) ?? null;
        },
        [categoriesById],
    );

    const filteredRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const base = type
            ? allCategories.filter((c) => c.type === type)
            : allCategories;

        const parents = base
            .filter((c) => !c.parent_id)
            .sort((a, b) => a.name.localeCompare(b.name));

        const childrenByParentId = new Map<number, Category[]>();
        const orphans: Category[] = [];

        for (const c of base) {
            if (!c.parent_id) continue;
            if (categoriesById.has(c.parent_id)) {
                const list = childrenByParentId.get(c.parent_id) ?? [];
                list.push(c);
                childrenByParentId.set(c.parent_id, list);
            } else {
                orphans.push(c);
            }
        }

        for (const [pid, list] of childrenByParentId) {
            childrenByParentId.set(
                pid,
                list.sort((a, b) => a.name.localeCompare(b.name)),
            );
        }

        type Row = {
            category: Category;
            depth: 0 | 1;
            parentName: string | null;
        };

        const rows: Row[] = [];

        const matches = (cat: Category) => {
            if (!q) return true;
            const parent = getParent(cat);
            return (
                cat.name.toLowerCase().includes(q) ||
                (parent?.name.toLowerCase().includes(q) ?? false)
            );
        };

        for (const parent of parents) {
            const children = childrenByParentId.get(parent.id) ?? [];
            const parentMatches = q ? matches(parent) : true;
            const matchingChildren = q ? children.filter(matches) : children;

            if (!q) {
                rows.push({ category: parent, depth: 0, parentName: null });
                for (const child of children) {
                    rows.push({
                        category: child,
                        depth: 1,
                        parentName: parent.name,
                    });
                }
                continue;
            }

            if (parentMatches || matchingChildren.length > 0) {
                rows.push({ category: parent, depth: 0, parentName: null });

                const childrenToShow = parentMatches
                    ? children
                    : matchingChildren;
                for (const child of childrenToShow) {
                    rows.push({
                        category: child,
                        depth: 1,
                        parentName: parent.name,
                    });
                }
            }
        }

        if (q) {
            const addedIds = new Set(rows.map((r) => r.category.id));
            const otherMatches = base
                .filter((c) => !addedIds.has(c.id))
                .filter(matches)
                .sort((a, b) => a.name.localeCompare(b.name));

            for (const c of otherMatches) {
                const parent = getParent(c);
                rows.push({
                    category: c,
                    depth: c.parent_id ? 1 : 0,
                    parentName: parent?.name ?? null,
                });
            }
        } else {
            orphans
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach((c) => {
                    const parent = getParent(c);
                    rows.push({
                        category: c,
                        depth: c.parent_id ? 1 : 0,
                        parentName: parent?.name ?? null,
                    });
                });
        }

        return rows;
    }, [allCategories, categoriesById, getParent, searchQuery, type]);

    const selectedCategory = useMemo(
        () => allCategories.find((c) => c.id.toString() === value),
        [allCategories, value],
    );

    const selectedCategoryParentName = useMemo(() => {
        if (!selectedCategory) return null;
        const parent = getParent(selectedCategory);
        return parent?.name ?? null;
    }, [getParent, selectedCategory]);

    const handleCategoryCreated = (newCategory: Category) => {
        setLocallyCreated((prev) => {
            const byId = new Map(prev.map((c) => [c.id, c]));
            byId.set(newCategory.id, newCategory);
            return Array.from(byId.values());
        });
        if (onCategoryCreated) {
            onCategoryCreated(newCategory);
        }
        onValueChange(newCategory.id.toString());
        setOpen(false);
    };

    return (
        <>
            <div className="space-y-1">
                <Popover
                    open={open}
                    onOpenChange={(nextOpen) => {
                        setOpen(nextOpen);
                        if (!nextOpen) {
                            setSearchQuery('');
                        }
                    }}
                >
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            disabled={disabled}
                            className={cn(
                                'w-full justify-between px-3 font-normal',
                                !value && 'text-muted-foreground',
                                error && 'border-red-500',
                                triggerClassName,
                            )}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {selectedSpecial ? (
                                <span className="truncate">
                                    {selectedSpecial.label}
                                </span>
                            ) : selectedCategory ? (
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div
                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                                        style={{
                                            backgroundColor:
                                                selectedCategory.color,
                                        }}
                                    >
                                        <DynamicIcon
                                            name={selectedCategory.icon}
                                            fallback={Folder}
                                            className="h-3 w-3 text-white"
                                        />
                                    </div>
                                    <span className="truncate">
                                        {selectedCategoryParentName
                                            ? `${selectedCategoryParentName} / `
                                            : ''}
                                        {selectedCategory.name}
                                    </span>
                                </div>
                            ) : (
                                placeholder
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-full min-w-[var(--radix-popover-trigger-width)] p-0"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
                            <div className="p-1">
                                {allowCreate && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full justify-start font-medium text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                                        onClick={() => {
                                            setIsDialogOpen(true);
                                            setOpen(false);
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create new category...
                                    </Button>
                                )}

                                {specialOptions &&
                                    specialOptions.length > 0 && (
                                        <div
                                            className={cn(
                                                allowCreate && 'mt-1 border-t',
                                            )}
                                        >
                                            {specialOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    className={cn(
                                                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                                        value === opt.value &&
                                                            'bg-accent text-accent-foreground',
                                                    )}
                                                    onClick={() => {
                                                        onValueChange(
                                                            opt.value,
                                                        );
                                                        setOpen(false);
                                                    }}
                                                >
                                                    <span className="truncate">
                                                        {opt.label}
                                                    </span>
                                                    {value === opt.value && (
                                                        <Check className="ml-auto h-4 w-4 opacity-50" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                <div className="mt-1 space-y-1">
                                    {filteredRows.length === 0 && (
                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                            No categories found.
                                        </p>
                                    )}
                                    {filteredRows.map((row) => {
                                        const parentName =
                                            row.parentName ??
                                            getParent(row.category)?.name ??
                                            null;

                                        return (
                                            <button
                                                key={row.category.id}
                                                type="button"
                                                className={cn(
                                                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                                    row.depth === 1 && 'pl-7',
                                                    value ===
                                                        row.category.id.toString() &&
                                                        'bg-accent text-accent-foreground',
                                                )}
                                                onClick={() => {
                                                    onValueChange(
                                                        row.category.id.toString(),
                                                    );
                                                    setOpen(false);
                                                }}
                                            >
                                                <div
                                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                                                    style={{
                                                        backgroundColor:
                                                            row.category.color,
                                                    }}
                                                >
                                                    <DynamicIcon
                                                        name={row.category.icon}
                                                        fallback={Folder}
                                                        className="h-3 w-3 text-white"
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div
                                                        className={cn(
                                                            'truncate',
                                                            row.depth === 0 &&
                                                                'font-medium',
                                                        )}
                                                    >
                                                        {row.category.name}
                                                    </div>
                                                    {row.depth === 1 &&
                                                        parentName && (
                                                            <div className="truncate text-xs text-muted-foreground">
                                                                {parentName}
                                                            </div>
                                                        )}
                                                </div>

                                                {value ===
                                                    row.category.id.toString() && (
                                                    <Check className="ml-auto h-4 w-4 opacity-50" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {allowCreate && (
                <QuickCreateCategoryModal
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    defaultType={type ?? 'expense'}
                    lockType={!!type}
                    existingCategories={allCategories}
                    onCreated={handleCategoryCreated}
                />
            )}
        </>
    );
}
