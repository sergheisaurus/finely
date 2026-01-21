import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getIconByName } from '@/components/ui/icon-picker';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import type { Category } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { Edit, FolderTree, Plus, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categories',
        href: '/categories',
    },
];

export default function CategoriesIndex() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
        }
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
            await fetchCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            toast.error('Failed to delete category', {
                description:
                    'This category may be in use by transactions or have subcategories.',
            });
        }
    };

    const incomeCategories = categories.filter((c) => c.type === 'income');
    const expenseCategories = categories.filter((c) => c.type === 'expense');

    const renderCategory = (category: Category) => {
        const subcategories = categories.filter(
            (c) => c.parent_id === category.id,
        );

        return (
            <div key={category.id} className="space-y-2">
                <Card className="group hover-lift overflow-hidden transition-all duration-200 hover:shadow-md">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: category.color }}
                                >
                                    {(() => {
                                        const IconComponent = category.icon
                                            ? getIconByName(category.icon)
                                            : null;
                                        return IconComponent ? (
                                            <IconComponent className="h-5 w-5 text-white" />
                                        ) : (
                                            <Tag className="h-5 w-5 text-white" />
                                        );
                                    })()}
                                </div>
                                <div>
                                    <h3 className="font-semibold">
                                        {category.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {category.transactions_count || 0}{' '}
                                        transactions
                                        {subcategories.length > 0 &&
                                            ` • ${subcategories.length} subcategories`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.visit(
                                            `/categories/${category.id}/edit`,
                                        )
                                    }
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(category.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Subcategories */}
                {subcategories.length > 0 && (
                    <div className="ml-8 space-y-2">
                        {subcategories.map((sub) => (
                            <Card key={sub.id} className="border-l-4">
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-8 w-8 items-center justify-center rounded"
                                                style={{
                                                    backgroundColor: sub.color,
                                                }}
                                            >
                                                {(() => {
                                                    const IconComponent =
                                                        sub.icon
                                                            ? getIconByName(
                                                                  sub.icon,
                                                              )
                                                            : null;
                                                    return IconComponent ? (
                                                        <IconComponent className="h-4 w-4 text-white" />
                                                    ) : (
                                                        <Tag className="h-4 w-4 text-white" />
                                                    );
                                                })()}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium">
                                                    {sub.name}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {sub.transactions_count ||
                                                        0}{' '}
                                                    transactions
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    router.visit(
                                                        `/categories/${sub.id}/edit`,
                                                    )
                                                }
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(sub.id)
                                                }
                                            >
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    };

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
                    <Button
                        onClick={() => router.visit('/categories/create')}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 hover:shadow-xl hover:shadow-orange-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="animate-fade-in-up stagger-1 hover-lift bg-gradient-to-br from-green-500 to-green-600 text-white opacity-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Total Categories
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {categories.length}
                                    </p>
                                </div>
                                <FolderTree className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-2 hover-lift bg-gradient-to-br from-blue-500 to-blue-600 text-white opacity-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Income Categories
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {incomeCategories.length}
                                    </p>
                                </div>
                                <Tag className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-3 hover-lift bg-gradient-to-br from-purple-500 to-purple-600 text-white opacity-0 sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Expense Categories
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {expenseCategories.length}
                                    </p>
                                </div>
                                <Tag className="h-10 w-10 opacity-80 md:h-12 md:w-12" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {isLoading ? (
                    <div className="animate-fade-in-up stagger-4 grid gap-4 opacity-0">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-20 animate-pulse rounded-xl bg-muted"
                            />
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <Card className="animate-fade-in-up stagger-4 overflow-hidden opacity-0">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50">
                                <FolderTree className="h-10 w-10 text-orange-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No categories yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Get started by adding your first category
                            </p>
                            <Button
                                className="mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                                onClick={() =>
                                    router.visit('/categories/create')
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Category
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {expenseCategories.filter((c) => !c.parent_id).length >
                            0 && (
                            <div className="animate-fade-in-up stagger-4 space-y-4 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl">
                                    Expense Categories
                                </h2>
                                <div className="space-y-3">
                                    {expenseCategories
                                        .filter((c) => !c.parent_id)
                                        .map(renderCategory)}
                                </div>
                            </div>
                        )}

                        {incomeCategories.filter((c) => !c.parent_id).length >
                            0 && (
                            <div className="animate-fade-in-up stagger-5 space-y-4 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl">
                                    Income Categories
                                </h2>
                                <div className="space-y-3">
                                    {incomeCategories
                                        .filter((c) => !c.parent_id)
                                        .map(renderCategory)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
