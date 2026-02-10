import { CreateCategoryDialog } from '@/components/finance/create-category-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { getIconByName } from '@/components/ui/icon-picker';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import type { Category } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Edit,
    Plus,
    Search,
    Tag,
    Trash2,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categories',
        href: '/categories',
    },
];

export default function CategoriesIndex({
    categories: initialCategories,
}: {
    categories: { data: Category[] };
}) {
    const [categories, setCategories] = useState<Category[]>(
        initialCategories.data,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        setCategories(initialCategories.data);
    }, [initialCategories]);

    const handleCategoryCreated = (newCategory: Category) => {
        setCategories((prev) => [...prev, newCategory]);
        router.reload({ only: ['categories'] });
    };

    const handleDelete = async (categoryId: number) => {
        const category = categories.find((c) => c.id === categoryId);
        if (
            !confirm(
                `Are you sure you want to delete "${category?.name}"? This will affect existing transactions.`,
            )
        ) {
            return;
        }

        try {
            await api.delete(`/categories/${categoryId}`);
            toast.success('Category deleted!', {
                description: `${category?.name} has been removed.`,
            });
            router.reload({ only: ['categories'] });
        } catch (error) {
            console.error('Failed to delete category:', error);
            toast.error('Failed to delete category', {
                description:
                    'This category may be in use by transactions or have subcategories.',
            });
        }
    };

    const filteredCategories = categories.filter((category) => {
        const matchesSearch = category.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || category.type === activeTab;
        return matchesSearch && matchesTab;
    });

    const incomeCategories = categories.filter((c) => c.type === 'income');
    const expenseCategories = categories.filter((c) => c.type === 'expense');

    // Stats
    const totalTransactions = categories.reduce(
        (acc, curr) => acc + (curr.transactions_count || 0),
        0,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl dark:from-white dark:to-slate-400">
                            Categories
                        </h1>
                        <p className="text-muted-foreground">
                            Organize your income and expenses
                        </p>
                    </div>
                    <CreateCategoryDialog
                        open={isCreateOpen}
                        onOpenChange={setIsCreateOpen}
                        categories={categories}
                        onCategoryCreated={handleCategoryCreated}
                        trigger={
                            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 hover:shadow-xl hover:shadow-orange-500/30">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Category
                            </Button>
                        }
                    />
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="animate-fade-in-up stagger-1 hover-lift border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Income Categories
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {incomeCategories.length}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-2 hover-lift border-l-4 border-l-orange-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Expense Categories
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {expenseCategories.length}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                                    <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-3 hover-lift border-l-4 border-l-purple-500 sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Transactions
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {totalTransactions}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                                    <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card className="animate-fade-in-up stagger-4">
                    <CardContent className="p-6">
                        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <Tabs
                                value={activeTab}
                                onValueChange={setActiveTab}
                                className="w-full md:w-auto"
                            >
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="expense">
                                        Expense
                                    </TabsTrigger>
                                    <TabsTrigger value="income">
                                        Income
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="relative w-full md:w-64">
                                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search categories..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            {filteredCategories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                        <Search className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold">
                                        No categories found
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Try adjusting your search or filter
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* Render Top Level Categories */}
                                    {filteredCategories
                                        .filter((c) => !c.parent_id)
                                        .map((category) => (
                                            <CategoryRow
                                                key={category.id}
                                                category={category}
                                                allCategories={
                                                    filteredCategories
                                                } // Pass filtered list to show relevant children
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

// Sub-component for Category Row to handle collapsible state cleanly
function CategoryRow({
    category,
    allCategories,
    onDelete,
}: {
    category: Category;
    allCategories: Category[];
    onDelete: (id: number) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    // Find children in the provided list (so if we filter, we might hide children?
    // Or should we always show children if parent matches?
    // Usually if parent matches search, we show it.
    // If child matches search, we show child (and maybe parent).
    // Current logic: filteredCategories contains flat list of matches.
    // So we just look for children in 'allCategories' which IS the filtered list.
    const children = allCategories.filter((c) => c.parent_id === category.id);
    const hasChildren = children.length > 0;

    const IconComponent = category.icon ? getIconByName(category.icon) : Tag;

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="rounded-lg border bg-card text-card-foreground transition-all hover:bg-accent/5"
        >
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                    {hasChildren ? (
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                            >
                                {isOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                        </CollapsibleTrigger>
                    ) : (
                        <div className="w-8" /> // Spacer
                    )}

                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg shadow-sm"
                        style={{ backgroundColor: category.color }}
                    >
                        {IconComponent && (
                            <IconComponent className="h-5 w-5 text-white" />
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">
                                {category.name}
                            </span>
                            {category.type && (
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                        category.type === 'income'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                                    )}
                                >
                                    {category.type}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {category.transactions_count || 0} transactions
                        </p>
                    </div>
                </div>

                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 lg:opacity-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            router.visit(`/categories/${category.id}/edit`)
                        }
                    >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(category.id)}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </div>

            {hasChildren && (
                <CollapsibleContent>
                    <div className="border-t bg-muted/30 px-4 py-2">
                        {children.map((child) => (
                            <div
                                key={child.id}
                                className="group flex items-center justify-between rounded-md py-2 pr-2 pl-12 hover:bg-accent/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-8 w-8 items-center justify-center rounded shadow-sm"
                                        style={{
                                            backgroundColor: child.color,
                                        }}
                                    >
                                        <DynamicIcon
                                            name={child.icon}
                                            fallback={Tag}
                                            className="h-4 w-4 text-white"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {child.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {child.transactions_count || 0} txs
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                            router.visit(
                                                `/categories/${child.id}/edit`,
                                            )
                                        }
                                    >
                                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onDelete(child.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            )}
        </Collapsible>
    );
}
