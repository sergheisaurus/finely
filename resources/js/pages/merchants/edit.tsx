import { Button } from '@/components/ui/button';
import {
    CardContent,
    CardHeader,
    CardTitle,
    Card as CardUI,
} from '@/components/ui/card';
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
import type { Merchant } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { Building2, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MerchantEditProps {
    merchantId: string;
}

export default function MerchantEdit({ merchantId }: MerchantEditProps) {
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form fields
    const [name, setName] = useState('');
    const [type, setType] = useState<'company' | 'person'>('company');
    const [imagePath, setImagePath] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Merchants',
            href: '/merchants',
        },
        {
            title: merchant?.name || 'Edit',
            href: `/merchants/${merchantId}/edit`,
        },
    ];

    const fetchMerchant = useCallback(async () => {
        try {
            const response = await api.get(`/merchants/${merchantId}`);
            const data = response.data.data;
            setMerchant(data);
            setName(data.name);
            setType(data.type);
            setImagePath(data.image_path || '');
        } catch (error) {
            console.error('Failed to fetch merchant:', error);
            toast.error('Failed to load merchant');
            router.visit('/merchants');
        } finally {
            setIsLoadingData(false);
        }
    }, [merchantId]);

    useEffect(() => {
        fetchMerchant();
    }, [fetchMerchant]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const payload: Record<string, unknown> = {
                name,
                type,
            };

            if (imagePath) {
                payload.image_path = imagePath;
            } else {
                payload.image_path = null;
            }

            await api.put(`/merchants/${merchantId}`, payload);

            toast.success('Merchant updated successfully!', {
                description: `${name} has been updated.`,
            });

            router.visit('/merchants');
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string> } };
            };
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                console.error('Failed to update merchant:', error);
                toast.error('Failed to update merchant', {
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
                <Head title="Edit Merchant" />
                <div className="mx-auto max-w-3xl space-y-6 p-6">
                    <div className="h-96 animate-pulse rounded-lg bg-muted" />
                </div>
            </AppLayout>
        );
    }

    if (!merchant) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Merchant Not Found" />
                <div className="mx-auto max-w-3xl p-6">
                    <CardUI>
                        <CardContent className="p-12 text-center">
                            <h3 className="text-lg font-semibold">
                                Merchant not found
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                The merchant you're looking for doesn't exist
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() => router.visit('/merchants')}
                            >
                                Back to Merchants
                            </Button>
                        </CardContent>
                    </CardUI>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${merchant.name}`} />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">Edit Merchant</h1>
                    <p className="text-muted-foreground">
                        Update merchant details
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <CardUI>
                        <CardHeader>
                            <CardTitle>Merchant Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="e.g., Migros, Coop, John Smith"
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
                                        onValueChange={(
                                            value: 'company' | 'person',
                                        ) => setType(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="company">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" />
                                                    Company / Store
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="person">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Person
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-red-500">
                                            {errors.type}
                                        </p>
                                    )}
                                </div>

                                {/* Image Path */}
                                <div className="space-y-2">
                                    <Label htmlFor="image_path">
                                        Image URL (Optional)
                                    </Label>
                                    <Input
                                        id="image_path"
                                        value={imagePath}
                                        onChange={(e) =>
                                            setImagePath(e.target.value)
                                        }
                                        placeholder="https://example.com/logo.png"
                                        maxLength={500}
                                        type="url"
                                    />
                                    {errors.image_path && (
                                        <p className="text-sm text-red-500">
                                            {errors.image_path}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        URL to a logo or image for this merchant
                                    </p>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="space-y-2">
                                <Label>Preview</Label>
                                <div className="flex h-20 items-center gap-3 rounded-lg border p-4">
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                                            type === 'company'
                                                ? 'bg-purple-100'
                                                : 'bg-green-100'
                                        }`}
                                    >
                                        {imagePath ? (
                                            <img
                                                src={imagePath}
                                                alt={name}
                                                className="h-10 w-10 rounded object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display =
                                                        'none';
                                                }}
                                            />
                                        ) : type === 'company' ? (
                                            <Building2 className="h-6 w-6 text-purple-600" />
                                        ) : (
                                            <User className="h-6 w-6 text-green-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            {name || 'Merchant Name'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {type === 'company'
                                                ? 'Company'
                                                : 'Person'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    <div className="mt-6 flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/merchants')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Merchant'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
