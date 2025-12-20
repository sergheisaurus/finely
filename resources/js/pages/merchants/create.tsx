import { Button } from '@/components/ui/button';
import {
    Card as CardUI,
    CardContent,
    CardHeader,
    CardTitle,
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
import { Head, router } from '@inertiajs/react';
import { Building2, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Merchants',
        href: '/merchants',
    },
    {
        title: 'Create',
        href: '/merchants/create',
    },
];

export default function MerchantCreate() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form fields
    const [name, setName] = useState('');
    const [type, setType] = useState<'company' | 'person'>('company');
    const [imagePath, setImagePath] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const payload: any = {
                name,
                type,
            };

            if (imagePath) payload.image_path = imagePath;

            await api.post('/merchants', payload);

            toast.success('Merchant created successfully!', {
                description: `${name} has been added to your merchants.`,
            });

            router.visit('/merchants');
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to create merchant:', error);
                toast.error('Failed to create merchant', {
                    description: 'Please try again.',
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Merchant" />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">New Merchant</h1>
                    <p className="text-muted-foreground">
                        Add a store, company, or person you transact with
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
                                        onChange={(e) => setName(e.target.value)}
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
                                        onValueChange={(value: any) =>
                                            setType(value)
                                        }
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
                            {isSubmitting
                                ? 'Creating...'
                                : 'Create Merchant'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
