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
import { Head, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Building2, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Merchant } from '@/types/finance';
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
    const [isSecret, setIsSecret] = useState(false);
    const [coverMerchantId, setCoverMerchantId] = useState('');
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const fetchMerchants = useCallback(async () => {
        try {
            const response = await api.get('/merchants');
            setMerchants(response.data.data);
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => {
        fetchMerchants();
    }, [fetchMerchants]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const payload: Record<string, unknown> = {
                name,
                type,
                is_secret: isSecret,
            };

            if (imagePath) payload.image_path = imagePath;
            if (isSecret && coverMerchantId) {
                payload.cover_merchant_id = parseInt(coverMerchantId);
            }

            await api.post('/merchants', payload);

            toast.success('Merchant created successfully!', {
                description: `${name} has been added to your merchants.`,
            });

            router.visit('/merchants');
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string> } };
            };
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
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

    const potentialCovers = merchants.filter(
        (m) => m.type === type && !m.is_secret,
    );

    if (isLoadingData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Create Merchant" />
                <div className="mx-auto max-w-3xl space-y-6 p-6">
                    <div className="h-96 animate-pulse rounded-lg bg-muted" />
                </div>
            </AppLayout>
        );
    }

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

                                {/* Secret Mode */}
                                <div className="flex flex-col gap-4 rounded-lg border p-4 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-fuchsia-500 dark:text-fuchsia-400">
                                                🔒 Secret Merchant
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Hide this merchant and its transactions
                                            </p>
                                        </div>
                                        <Switch
                                            checked={isSecret}
                                            onCheckedChange={(checked) => {
                                                setIsSecret(checked);
                                                if (!checked) setCoverMerchantId('');
                                            }}
                                            className="data-[state=checked]:bg-fuchsia-500"
                                        />
                                    </div>

                                    {isSecret && (
                                        <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-fuchsia-500 dark:text-fuchsia-400">
                                                Cover Merchant (Optional)
                                            </Label>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                When not in secret mode, transactions will masquerade under this merchant.
                                            </p>
                                            <Select
                                                value={coverMerchantId || 'none'}
                                                onValueChange={(val) =>
                                                    setCoverMerchantId(val === 'none' ? '' : val)
                                                }
                                            >
                                                <SelectTrigger className="border-fuchsia-500/50 focus:ring-fuchsia-500/50">
                                                    <SelectValue placeholder="Select a safe cover merchant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        No Cover (Hidden entirely)
                                                    </SelectItem>
                                                    {potentialCovers.map((m) => (
                                                        <SelectItem
                                                            key={m.id}
                                                            value={m.id.toString()}
                                                        >
                                                            {m.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="space-y-2">
                                <Label>Preview</Label>
                                <div className="flex h-20 items-center gap-3 rounded-lg border p-4">
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-lg ${type === 'company'
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
                            {isSubmitting ? 'Creating...' : 'Create Merchant'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
