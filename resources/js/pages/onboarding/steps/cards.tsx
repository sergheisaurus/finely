import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
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
import type { BankAccount, Card as CardType } from '@/types/finance';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CardsStepProps {
    accounts: BankAccount[];
    onSubmit: (data: CardType[]) => Promise<void>;
    onSkip: () => void;
    isSubmitting: boolean;
}

interface CardFormData {
    id: string;
    type: 'debit' | 'credit';
    bank_account_id: string;
    card_holder_name: string;
    card_number: string;
    card_network: string;
    expiry_month: string;
    expiry_year: string;
    credit_limit: string;
    current_balance: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 15 }, (_, i) => currentYear + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

const generateId = () => Math.random().toString(36).substring(2, 15);

const emptyCard = (): CardFormData => ({
    id: generateId(),
    type: 'debit',
    bank_account_id: '',
    card_holder_name: '',
    card_number: '',
    card_network: 'visa',
    expiry_month: '',
    expiry_year: '',
    credit_limit: '0',
    current_balance: '0',
});

export default function CardsStep({
    accounts,
    onSubmit,
    onSkip,
    isSubmitting,
}: CardsStepProps) {
    const [cards, setCards] = useState<CardFormData[]>([]);

    const addCard = () => {
        const newCard = emptyCard();
        if (accounts.length > 0) {
            newCard.bank_account_id = accounts[0].id.toString();
        }
        setCards([...cards, newCard]);
    };

    const removeCard = (id: string) => {
        setCards(cards.filter((c) => c.id !== id));
    };

    const updateCard = (
        id: string,
        field: keyof CardFormData,
        value: string,
    ) => {
        setCards(
            cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formattedCards = cards.map((card) => ({
            type: card.type,
            bank_account_id: card.bank_account_id
                ? parseInt(card.bank_account_id)
                : null,
            card_holder_name: card.card_holder_name,
            card_number: card.card_number,
            card_network: card.card_network,
            expiry_month: parseInt(card.expiry_month),
            expiry_year: parseInt(card.expiry_year),
            credit_limit:
                card.type === 'credit'
                    ? parseFloat(card.credit_limit) || 0
                    : null,
            current_balance: parseFloat(card.current_balance) || 0,
        }));

        await onSubmit(formattedCards as unknown as CardType[]);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Add Your Cards
                </CardTitle>
                <CardDescription>
                    Link debit or credit cards to track spending. You can skip
                    this step.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {cards.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed p-8 text-center">
                            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">
                                No cards added yet. Add your cards or skip this
                                step.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addCard}
                                className="mt-4"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Card
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cards.map((card, index) => (
                                <div
                                    key={card.id}
                                    className="space-y-4 rounded-lg border p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">
                                            Card {index + 1}
                                        </h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeCard(card.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Card Type</Label>
                                            <Select
                                                value={card.type}
                                                onValueChange={(v) =>
                                                    updateCard(
                                                        card.id,
                                                        'type',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="debit">
                                                        Debit
                                                    </SelectItem>
                                                    <SelectItem value="credit">
                                                        Credit
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Bank Account</Label>
                                            <Select
                                                value={card.bank_account_id}
                                                onValueChange={(v) =>
                                                    updateCard(
                                                        card.id,
                                                        'bank_account_id',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.map((account) => (
                                                        <SelectItem
                                                            key={account.id}
                                                            value={account.id.toString()}
                                                        >
                                                            {account.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Card Holder Name</Label>
                                            <Input
                                                value={card.card_holder_name}
                                                onChange={(e) =>
                                                    updateCard(
                                                        card.id,
                                                        'card_holder_name',
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                placeholder="JOHN DOE"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Card Number</Label>
                                            <Input
                                                value={card.card_number}
                                                onChange={(e) =>
                                                    updateCard(
                                                        card.id,
                                                        'card_number',
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                placeholder="1234567890123456"
                                                maxLength={19}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Card Network</Label>
                                            <Select
                                                value={card.card_network}
                                                onValueChange={(v) =>
                                                    updateCard(
                                                        card.id,
                                                        'card_network',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="visa">
                                                        Visa
                                                    </SelectItem>
                                                    <SelectItem value="mastercard">
                                                        Mastercard
                                                    </SelectItem>
                                                    <SelectItem value="amex">
                                                        Amex
                                                    </SelectItem>
                                                    <SelectItem value="discover">
                                                        Discover
                                                    </SelectItem>
                                                    <SelectItem value="other">
                                                        Other
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <Label>Expiry Month</Label>
                                                <Select
                                                    value={card.expiry_month}
                                                    onValueChange={(v) =>
                                                        updateCard(
                                                            card.id,
                                                            'expiry_month',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="MM" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {months.map((m) => (
                                                            <SelectItem
                                                                key={m}
                                                                value={m.toString()}
                                                            >
                                                                {m
                                                                    .toString()
                                                                    .padStart(
                                                                        2,
                                                                        '0',
                                                                    )}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Year</Label>
                                                <Select
                                                    value={card.expiry_year}
                                                    onValueChange={(v) =>
                                                        updateCard(
                                                            card.id,
                                                            'expiry_year',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="YYYY" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {years.map((y) => (
                                                            <SelectItem
                                                                key={y}
                                                                value={y.toString()}
                                                            >
                                                                {y}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {card.type === 'credit' && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label>Credit Limit</Label>
                                                    <Input
                                                        type="number"
                                                        value={
                                                            card.credit_limit
                                                        }
                                                        onChange={(e) =>
                                                            updateCard(
                                                                card.id,
                                                                'credit_limit',
                                                                e.target.value,
                                                            )
                                                        }
                                                        min="0"
                                                        step="100"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>
                                                        Current Balance
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        value={
                                                            card.current_balance
                                                        }
                                                        onChange={(e) =>
                                                            updateCard(
                                                                card.id,
                                                                'current_balance',
                                                                e.target.value,
                                                            )
                                                        }
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addCard}
                                className="w-full"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Another Card
                            </Button>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onSkip}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Skip for now
                        </Button>
                        {cards.length > 0 && (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                            >
                                {isSubmitting ? 'Saving...' : 'Save & Continue'}
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
