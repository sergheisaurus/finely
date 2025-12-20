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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categories',
        href: '/categories',
    },
    {
        title: 'Create',
        href: '/categories/create',
    },
];

export default function CategoryCreate() {
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
            setIsLoadingData(false);
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

            if (parentId) payload.parent_id = parseInt(parentId);
            if (icon) payload.icon = icon;

            const response = await api.post('/categories', payload);

            toast.success('Category created successfully!', {
                description: `${name} has been added to your categories.`,
            });

            router.visit('/categories');
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to create category:', error);
                toast.error('Failed to create category', {
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
                <Head title="Create Category" />
                <div className="mx-auto max-w-3xl space-y-6 p-6">
                    <div className="h-96 animate-pulse rounded-lg bg-muted" />
                </div>
            </AppLayout>
        );
    }

    // Filter parent categories by type
    const parentCategories = categories.filter(
        (c) => c.type === type && !c.parent_id,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Category" />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">New Category</h1>
                    <p className="text-muted-foreground">
                        Add a new category to organize your transactions
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
                                            {parentCategories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id.toString()}
                                                >
                                                    {category.icon}{' '}
                                                    {category.name}
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
                                ? 'Creating...'
                                : 'Create Category'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
