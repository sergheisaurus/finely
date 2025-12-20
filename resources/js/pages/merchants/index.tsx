import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import type { Merchant } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { Building2, Edit, Plus, Store, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Merchants',
        href: '/merchants',
    },
];

export default function MerchantsIndex() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMerchants();
    }, []);

    const fetchMerchants = async () => {
        try {
            const response = await api.get('/merchants');
            setMerchants(response.data.data);
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (merchantId: number) => {
        const merchant = merchants.find((m) => m.id === merchantId);
        if (
            !confirm(
                `Are you sure you want to delete "${merchant?.name}"? This will affect existing transactions.`,
            )
        ) {
            return;
        }

        try {
            await api.delete(`/merchants/${merchantId}`);
            toast.success('Merchant deleted!', {
                description: `${merchant?.name} has been removed.`,
            });
            await fetchMerchants();
        } catch (error) {
            console.error('Failed to delete merchant:', error);
            toast.error('Failed to delete merchant', {
                description:
                    'This merchant may be in use by existing transactions.',
            });
        }
    };

    const companies = merchants.filter((m) => m.type === 'company');
    const people = merchants.filter((m) => m.type === 'person');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Merchants" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
                    <div>
                        <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                            Merchants
                        </h1>
                        <p className="text-muted-foreground">
                            Manage stores, companies, and people you transact
                            with
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/merchants/create')}
                        className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/25 transition-all hover:shadow-xl hover:shadow-rose-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Merchant
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="animate-fade-in-up stagger-1 opacity-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Total Merchants
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {merchants.length}
                                    </p>
                                </div>
                                <Store className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-2 opacity-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Companies
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {companies.length}
                                    </p>
                                </div>
                                <Building2 className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-3 opacity-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover-lift sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        People
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {people.length}
                                    </p>
                                </div>
                                <User className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up stagger-4 opacity-0">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-24 animate-pulse rounded-xl bg-muted"
                            />
                        ))}
                    </div>
                ) : merchants.length === 0 ? (
                    <Card className="animate-fade-in-up stagger-4 opacity-0 overflow-hidden">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50">
                                <Store className="h-10 w-10 text-rose-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No merchants yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Get started by adding your first merchant
                            </p>
                            <Button
                                className="mt-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                                onClick={() =>
                                    router.visit('/merchants/create')
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Merchant
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {companies.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-4 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl">
                                    Companies & Stores
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {companies.map((merchant) => (
                                        <Card key={merchant.id} className="group transition-all duration-200 hover:shadow-md hover-lift overflow-hidden">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50 transition-transform group-hover:scale-110">
                                                            <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold">
                                                                {merchant.name}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                {merchant.transactions_count ||
                                                                    0}{' '}
                                                                transactions
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/merchants/${merchant.id}/edit`,
                                                                )
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    merchant.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {people.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-5 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl">People</h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {people.map((merchant) => (
                                        <Card key={merchant.id} className="group transition-all duration-200 hover:shadow-md hover-lift overflow-hidden">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50 transition-transform group-hover:scale-110">
                                                            <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold">
                                                                {merchant.name}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                {merchant.transactions_count ||
                                                                    0}{' '}
                                                                transactions
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/merchants/${merchant.id}/edit`,
                                                                )
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    merchant.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
