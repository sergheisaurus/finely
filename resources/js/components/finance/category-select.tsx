import { CreateCategoryDialog } from '@/components/finance/create-category-dialog';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/finance';
import { Check, ChevronsUpDown, Plus, Search, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';

interface CategorySelectProps {
    value: string;
    onValueChange: (value: string) => void;
    categories: Category[];
    type?: 'income' | 'expense';
    error?: string;
    placeholder?: string;
    onCategoryCreated?: (category: Category) => void;
}

export function CategorySelect({
    value,
    onValueChange,
    categories,
    type,
    error,
    placeholder = 'Select category',
    onCategoryCreated,
}: CategorySelectProps) {
    const [open, setOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCategories = useMemo(() => {
        let base = type
            ? categories.filter((c) => c.type === type)
            : categories;

        if (searchQuery) {
            base = base.filter((c) =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()),
            );
        }

        // Return a flattened tree
        const topLevel = base.filter((c) => !c.parent_id);
        const result: Category[] = [];

        topLevel.forEach((parent) => {
            result.push(parent);
            const subs = base.filter((c) => c.parent_id === parent.id);
            result.push(...subs);
        });

        // Add orphans if searching (orphans are subcategories whose parents don't match the search)
        if (searchQuery) {
            const addedIds = new Set(result.map((c) => c.id));
            base.forEach((c) => {
                if (!addedIds.has(c.id)) {
                    result.push(c);
                }
            });
        }

        return result;
    }, [categories, type, searchQuery]);

    const selectedCategory = useMemo(
        () => categories.find((c) => c.id.toString() === value),
        [categories, value],
    );

    const handleCategoryCreated = (newCategory: Category) => {
        if (onCategoryCreated) {
            onCategoryCreated(newCategory);
        }
        onValueChange(newCategory.id.toString());
        setOpen(false);
    };

    return (
        <>
            <div className="space-y-1">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                                'w-full justify-between px-3 font-normal',
                                !value && 'text-muted-foreground',
                                error && 'border-red-500',
                            )}
                        >
                            {selectedCategory ? (
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
                                            fallback={Tag}
                                            className="h-3 w-3 text-white"
                                        />
                                    </div>
                                    <span className="truncate">
                                        {selectedCategory.parent &&
                                            `${selectedCategory.parent.name} > `}
                                        {selectedCategory.name}
                                    </span>
                                </div>
                            ) : (
                                placeholder
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[300px]">
                            <div className="p-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                    onClick={() => {
                                        setIsDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create new category...
                                </Button>
                                <div className="mt-1 space-y-1">
                                    {filteredCategories.length === 0 && (
                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                            No categories found.
                                        </p>
                                    )}
                                    {filteredCategories.map((category) => (
                                        <button
                                            key={category.id}
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                                category.parent_id && 'ml-4',
                                                value ===
                                                    category.id.toString() &&
                                                    'bg-accent text-accent-foreground',
                                            )}
                                            onClick={() => {
                                                onValueChange(
                                                    category.id.toString(),
                                                );
                                                setOpen(false);
                                            }}
                                        >
                                            <div
                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                                                style={{
                                                    backgroundColor:
                                                        category.color,
                                                }}
                                            >
                                                <DynamicIcon
                                                    name={category.icon}
                                                    fallback={Tag}
                                                    className="h-3 w-3 text-white"
                                                />
                                            </div>
                                            <span className="truncate">
                                                {category.name}
                                            </span>
                                            {value ===
                                                category.id.toString() && (
                                                <Check className="ml-auto h-4 w-4 opacity-50" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <CreateCategoryDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                categories={categories}
                type={type}
                onCategoryCreated={handleCategoryCreated}
            />
        </>
    );
}
