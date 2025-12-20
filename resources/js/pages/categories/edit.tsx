import { Button } from '@/components/ui/button';
import {
    Card as CardUI,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { getIconByName, IconPicker } from '@/components/ui/icon-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import type { Category } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { FolderTree } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CategoryEditProps {
    categoryId: string;
}

export default function CategoryEdit({ categoryId }: CategoryEditProps) {
    const [category, setCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form fields
    const [name, setName] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [parentId, setParentId] = useState('');
    const [icon, setIcon] = useState('');
    const [color, setColor] = useState('#3b82f6');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Categories',
            href: '/categories',
        },
        {
            title: category?.name || 'Edit',
            href: `/categories/${categoryId}/edit`,
        },
    ];

    useEffect(() => {
        Promise.all([fetchCategory(), fetchCategories()]).finally(() =>
            setIsLoadingData(false),
        );
    }, [categoryId]);

    const fetchCategory = async () => {
        try {
            const response = await api.get(`/categories/${categoryId}`);
            const data = response.data.data;
            setCategory(data);
            setName(data.name);
            setType(data.type);
            setParentId(data.parent_id?.toString() || '');
            setIcon(data.icon || '');
            setColor(data.color);
        } catch (error) {
            console.error('Failed to fetch category:', error);
            toast.error('Failed to load category');
            router.visit('/categories');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const payload: any = {
                name,
                type,
                color,
            };

            if (parentId) {
                payload.parent_id = parseInt(parentId);
            } else {
                payload.parent_id = null;
            }

            if (icon) {
                payload.icon = icon;
            } else {
                payload.icon = null;
            }

            await api.put(`/categories/${categoryId}`, payload);

            toast.success('Category updated successfully!', {
                description: `${name} has been updated.`,
            });

            router.visit('/categories');
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to update category:', error);
                toast.error('Failed to update category', {
                    description: 'Please try again.',
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit Category" />
                <div className="mx-auto max-w-3xl space-y-6 p-6">
                    <div className="h-96 animate-pulse rounded-lg bg-muted" />
                </div>
            </AppLayout>
        );
    }

    if (!category) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Category Not Found" />
                <div className="mx-auto max-w-3xl p-6">
                    <CardUI>
                        <CardContent className="p-12 text-center">
                            <h3 className="text-lg font-semibold">
                                Category not found
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                The category you're looking for doesn't exist
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() => router.visit('/categories')}
                            >
                                Back to Categories
                            </Button>
                        </CardContent>
                    </CardUI>
                </div>
            </AppLayout>
        );
    }

    // Filter parent categories by type, excluding current category and its children
    const parentCategories = categories.filter(
        (c) =>
            c.type === type &&
            !c.parent_id &&
            c.id !== category.id &&
            c.parent_id !== category.id,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${category.name}`} />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">Edit Category</h1>
                    <p className="text-muted-foreground">
                        Update category details
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <CardUI>
                        <CardHeader>
                            <CardTitle>Category Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., Groceries, Salary"
                                        required
                                        maxLength={255}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type *</Label>
                                    <Select
                                        value={type}
                                        onValueChange={(value: any) =>
                                            setType(value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expense">
                                                Expense
                                            </SelectItem>
                                            <SelectItem value="income">
                                                Income
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-red-500">
                                            {errors.type}
                                        </p>
                                    )}
                                </div>

                                {/* Parent Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="parent_id">
                                        Parent Category (Optional)
                                    </Label>
                                    <Select
                                        value={parentId || undefined}
                                        onValueChange={setParentId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="None (Top-level category)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {parentCategories.map((cat) => (
                                                <SelectItem
                                                    key={cat.id}
                                                    value={cat.id.toString()}
                                                >
                                                    {cat.icon} {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.parent_id && (
                                        <p className="text-sm text-red-500">
                                            {errors.parent_id}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Create a subcategory under an existing
                                        category
                                    </p>
                                </div>

                                {/* Color */}
                                <div className="space-y-2">
                                    <Label htmlFor="color">Color *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="color"
                                            type="color"
                                            value={color}
                                            onChange={(e) =>
                                                setColor(e.target.value)
                                            }
                                            className="h-10 w-20 cursor-pointer"
                                        />
                                        <Input
                                            value={color}
                                            onChange={(e) =>
                                                setColor(e.target.value)
                                            }
                                            placeholder="#3b82f6"
                                            pattern="^#[0-9A-Fa-f]{6}$"
                                            className="flex-1"
                                        />
                                    </div>
                                    {errors.color && (
                                        <p className="text-sm text-red-500">
                                            {errors.color}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Icon & Preview */}
                            <div className="space-y-2">
                                <Label>Icon & Preview</Label>
                                <div className="flex items-center gap-6">
                                    <IconPicker
                                        value={icon}
                                        onChange={setIcon}
                                        color={color}
                                    />
                                    <div
                                        className="flex flex-1 items-center gap-3 rounded-lg p-4"
                                        style={{
                                            backgroundColor: `${color}20`,
                                            borderLeft: `4px solid ${color}`,
                                        }}
                                    >
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                                            style={{ backgroundColor: color }}
                                        >
                                            {icon ? (
                                                (() => {
                                                    const IconComponent = getIconByName(icon);
                                                    return IconComponent ? (
                                                        <IconComponent className="h-5 w-5 text-white" />
                                                    ) : (
                                                        <FolderTree className="h-5 w-5 text-white" />
                                                    );
                                                })()
                                            ) : (
                                                <FolderTree className="h-5 w-5 text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold">
                                                {name || 'Category Name'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {type === 'income'
                                                    ? 'Income'
                                                    : 'Expense'}{' '}
                                                Category
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {errors.icon && (
                                    <p className="text-sm text-red-500">
                                        {errors.icon}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </CardUI>

                    <div className="mt-6 flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/categories')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Updating...'
                                : 'Update Category'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
