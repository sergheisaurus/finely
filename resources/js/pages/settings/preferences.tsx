import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import type {
    BankAccount,
    Card as CardType,
    UserPreference,
} from '@/types/finance';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Preferences',
        href: '/settings/preferences',
    },
];

export default function Preferences() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [preferences, setPreferences] = useState<UserPreference | null>(null);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [currency, setCurrency] = useState('CHF');
    const [theme, setTheme] = useState('system');
    const [defaultAccountId, setDefaultAccountId] = useState<string>('none');
    const [defaultCardId, setDefaultCardId] = useState<string>('none');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prefRes, accRes, cardRes] = await Promise.all([
                    api.get('/preferences'),
                    api.get('/accounts'),
                    api.get('/cards'),
                ]);

                setPreferences(prefRes.data.data);
                setAccounts(accRes.data.data);
                setCards(cardRes.data.data);

                // Set form defaults
                const pref = prefRes.data.data;
                setCurrency(pref.currency || 'CHF');
                setTheme(pref.theme || 'system');
                setDefaultAccountId(
                    pref.default_account_id?.toString() || 'none',
                );
                setDefaultCardId(pref.default_card_id?.toString() || 'none');
            } catch (error) {
                console.error('Failed to load preferences:', error);
                toast.error('Failed to load preferences');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: Record<string, unknown> = {
                currency,
                theme,
                default_account_id:
                    defaultAccountId === 'none'
                        ? null
                        : parseInt(defaultAccountId),
                default_card_id:
                    defaultCardId === 'none' ? null : parseInt(defaultCardId),
            };

            await api.put('/preferences', payload);
            toast.success('Preferences updated successfully');
        } catch (error) {
            console.error('Failed to update preferences:', error);
            toast.error('Failed to update preferences');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Preferences" />
                <SettingsLayout>
                    <div className="space-y-6">
                        <div className="h-64 animate-pulse rounded-lg bg-muted" />
                    </div>
                </SettingsLayout>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Preferences" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">Preferences</h3>
                        <p className="text-sm text-muted-foreground">
                            Manage your default currency and payment methods.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>General Defaults</CardTitle>
                            <CardDescription>
                                Set your preferred defaults for new transactions
                                and views.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currency">
                                    Default Currency
                                </Label>
                                <Select
                                    value={currency}
                                    onValueChange={setCurrency}
                                >
                                    <SelectTrigger id="currency">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CHF">
                                            CHF (Swiss Franc)
                                        </SelectItem>
                                        <SelectItem value="EUR">
                                            EUR (Euro)
                                        </SelectItem>
                                        <SelectItem value="USD">
                                            USD (US Dollar)
                                        </SelectItem>
                                        <SelectItem value="GBP">
                                            GBP (British Pound)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    This will be the default currency for new
                                    transactions.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="theme">Appearance</Label>
                                <Select value={theme} onValueChange={setTheme}>
                                    <SelectTrigger id="theme">
                                        <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="system">
                                            System
                                        </SelectItem>
                                        <SelectItem value="light">
                                            Light
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            Dark
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Choose your preferred color theme.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="default_account">
                                    Default Bank Account
                                </Label>
                                <Select
                                    value={defaultAccountId}
                                    onValueChange={setDefaultAccountId}
                                >
                                    <SelectTrigger id="default_account">
                                        <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            None
                                        </SelectItem>
                                        {accounts.map((account) => (
                                            <SelectItem
                                                key={account.id}
                                                value={account.id.toString()}
                                            >
                                                {account.name} (
                                                {account.currency}{' '}
                                                {account.balance.toFixed(2)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="default_card">
                                    Default Credit Card
                                </Label>
                                <Select
                                    value={defaultCardId}
                                    onValueChange={setDefaultCardId}
                                >
                                    <SelectTrigger id="default_card">
                                        <SelectValue placeholder="Select card" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            None
                                        </SelectItem>
                                        {cards.map((card) => (
                                            <SelectItem
                                                key={card.id}
                                                value={card.id.toString()}
                                            >
                                                {card.card_holder_name} -{' '}
                                                {card.card_network} (••••{' '}
                                                {card.card_number?.slice(-4)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving
                                        ? 'Saving...'
                                        : 'Save Preferences'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
