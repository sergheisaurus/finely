import { CreditCardVisual } from '@/components/finance/credit-card-visual';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { Card as CardType } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { CreditCard, Plus, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Cards',
        href: '/cards',
    },
];

export default function CardsIndex() {
    const [userCards, setUserCards] = useState<CardType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const response = await api.get('/cards');
            setUserCards(response.data.data);
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetDefault = async (cardId: number) => {
        try {
            const card = userCards.find(c => c.id === cardId);
            await api.post(`/cards/${cardId}/set-default`);
            await fetchCards();
            toast.success('Default card updated!', {
                description: `${card?.card_holder_name} ${card?.card_number ? `ending in ${card.card_number.slice(-4)}` : ''} is now your default card.`,
            });
        } catch (error) {
            console.error('Failed to set default card:', error);
        }
    };

    const handleDelete = async (cardId: number) => {
        const card = userCards.find(c => c.id === cardId);
        const cardIdentifier = card?.card_number
            ? `ending in ${card.card_number.slice(-4)}`
            : '';
        if (!confirm(`Are you sure you want to delete ${card?.card_holder_name} ${cardIdentifier}?`)) {
            return;
        }

        try {
            await api.delete(`/cards/${cardId}`);
            toast.success('Card deleted!', {
                description: `${card?.card_holder_name} ${cardIdentifier} has been removed.`,
            });
            await fetchCards();
        } catch (error) {
            console.error('Failed to delete card:', error);
        }
    };

    const debitCards = userCards.filter((card) => card.type === 'debit');
    const creditCards = userCards.filter((card) => card.type === 'credit');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cards" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
                    <div>
                        <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                            Cards
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your debit and credit cards
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/cards/create')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Card
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="animate-fade-in-up stagger-1 opacity-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Total Cards
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {userCards.length}
                                    </p>
                                </div>
                                <CreditCard className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-2 opacity-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Debit Cards
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {debitCards.length}
                                    </p>
                                </div>
                                <CreditCard className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-3 opacity-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover-lift sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Credit Cards
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {creditCards.length}
                                    </p>
                                </div>
                                <CreditCard className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {isLoading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up stagger-4 opacity-0">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-52 animate-pulse rounded-2xl bg-muted"
                            />
                        ))}
                    </div>
                ) : userCards.length === 0 ? (
                    <Card className="animate-fade-in-up stagger-4 opacity-0 overflow-hidden">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
                                <CreditCard className="h-10 w-10 text-purple-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No cards yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Get started by adding your first card
                            </p>
                            <Button
                                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                onClick={() => router.visit('/cards/create')}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Card
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {creditCards.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-4 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl">
                                    Credit Cards
                                </h2>
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {creditCards.map((card) => (
                                        <div
                                            key={card.id}
                                            className="relative"
                                        >
                                            {card.is_default && (
                                                <div className="absolute -right-2 -top-2 z-10 rounded-full bg-yellow-400 p-2">
                                                    <Star className="h-4 w-4 fill-white text-white" />
                                                </div>
                                            )}
                                            <CreditCardVisual
                                                card={card}
                                                showBalance
                                                onClick={() =>
                                                    router.visit(
                                                        `/cards/${card.id}`,
                                                    )
                                                }
                                            />
                                            <div className="mt-4 flex gap-2">
                                                {!card.is_default && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() =>
                                                            handleSetDefault(
                                                                card.id,
                                                            )
                                                        }
                                                    >
                                                        <Star className="mr-2 h-4 w-4" />
                                                        Set Default
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() =>
                                                        router.visit(
                                                            `/cards/${card.id}/edit`,
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                            {card.credit_limit && (
                                                <div className="mt-2 text-center text-sm text-muted-foreground">
                                                    {formatCurrency(
                                                        card.current_balance,
                                                        card.currency || 'CHF',
                                                    )}{' '}
                                                    /{' '}
                                                    {formatCurrency(
                                                        card.credit_limit,
                                                        card.currency || 'CHF',
                                                    )}{' '}
                                                    used
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {debitCards.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-5 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl">
                                    Debit Cards
                                </h2>
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {debitCards.map((card) => (
                                        <div
                                            key={card.id}
                                            className="relative"
                                        >
                                            {card.is_default && (
                                                <div className="absolute -right-2 -top-2 z-10 rounded-full bg-yellow-400 p-2">
                                                    <Star className="h-4 w-4 fill-white text-white" />
                                                </div>
                                            )}
                                            <CreditCardVisual
                                                card={card}
                                                showBalance={false}
                                                onClick={() =>
                                                    router.visit(
                                                        `/cards/${card.id}`,
                                                    )
                                                }
                                            />
                                            <div className="mt-4 flex gap-2">
                                                {!card.is_default && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() =>
                                                            handleSetDefault(
                                                                card.id,
                                                            )
                                                        }
                                                    >
                                                        <Star className="mr-2 h-4 w-4" />
                                                        Set Default
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() =>
                                                        router.visit(
                                                            `/cards/${card.id}/edit`,
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                            {card.bank_account && (
                                                <div className="mt-2 text-center text-sm text-muted-foreground">
                                                    Linked to{' '}
                                                    {card.bank_account.name}
                                                </div>
                                            )}
                                        </div>
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
