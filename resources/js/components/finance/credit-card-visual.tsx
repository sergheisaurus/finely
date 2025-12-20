import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card as CardUI } from '@/components/ui/card';
import type { Card } from '@/types/finance';
import { Copy, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreditCardVisualProps {
    card: Card;
    showBalance?: boolean;
    onClick?: () => void;
    className?: string;
}

export function CreditCardVisual({
    card,
    showBalance = true,
    onClick,
    className = '',
}: CreditCardVisualProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    const networkLogos: Record<string, string> = {
        visa: 'VISA',
        mastercard: 'Mastercard',
        amex: 'AMEX',
        discover: 'Discover',
    };

    const isPastDue =
        card.type === 'credit' &&
        card.payment_due_day &&
        new Date().getDate() > card.payment_due_day;

    const formatCardNumber = (number?: string) => {
        if (!number) return '•••• •••• •••• ••••';
        return number.replace(/(\d{4})/g, '$1 ').trim();
    };

    const copyCardDetails = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!card.card_number) {
            toast.error('Card number not available');
            return;
        }

        const details = `Card Number: ${card.card_number}
Card Holder: ${card.card_holder_name}
Expiry: ${String(card.expiry_month).padStart(2, '0')}/${card.expiry_year}
Network: ${card.card_network}`;

        navigator.clipboard.writeText(details);
        toast.success('Card details copied!', {
            description: 'Card information copied to clipboard',
        });
    };

    return (
        <div
            className={`group perspective-1000 ${className}`}
            onClick={onClick}
        >
            <div
                className={`relative h-52 w-full cursor-pointer transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                onDoubleClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front of card */}
                <CardUI
                    className="absolute inset-0 backface-hidden overflow-hidden border-none p-6 shadow-2xl"
                    style={{
                        background: `linear-gradient(135deg, ${card.color} 0%, ${adjustColorBrightness(card.color, -20)} 100%)`,
                        color: isLightColor(card.color) ? '#000' : '#fff',
                    }}
                >
                    <div className="flex h-full flex-col justify-between">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                {card.bank_account?.bank_name && (
                                    <p className="text-sm font-medium opacity-90">
                                        {card.bank_account.bank_name}
                                    </p>
                                )}
                                <p className="text-xs opacity-75">
                                    {card.type === 'debit'
                                        ? 'Debit Card'
                                        : 'Credit Card'}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-white/20"
                                    onClick={copyCardDetails}
                                    title="Copy card details"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                {isPastDue && (
                                    <Badge variant="destructive" className="text-xs">
                                        Payment Due
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Chip */}
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-12 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-md" />
                            <CreditCard className="h-6 w-6 opacity-50" />
                        </div>

                        {/* Card Number */}
                        <div>
                            <div className="mb-1 font-mono text-lg font-semibold tracking-wider">
                                {formatCardNumber(card.card_number)}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-[10px] uppercase opacity-60">
                                    Card Holder
                                </p>
                                <p className="text-sm font-semibold">
                                    {card.card_holder_name}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase opacity-60">
                                    Expires
                                </p>
                                <p className="font-mono text-sm font-semibold">
                                    {String(card.expiry_month).padStart(2, '0')}/
                                    {String(card.expiry_year).slice(-2)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold uppercase tracking-wider">
                                    {networkLogos[card.card_network] ||
                                        card.card_network}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardUI>

                {/* Back of card */}
                <CardUI
                    className="absolute inset-0 rotate-y-180 backface-hidden overflow-hidden border-none shadow-2xl"
                    style={{
                        background: `linear-gradient(135deg, ${card.color} 0%, ${adjustColorBrightness(card.color, -20)} 100%)`,
                        color: isLightColor(card.color) ? '#000' : '#fff',
                    }}
                >
                    <div className="flex h-full flex-col">
                        {/* Magnetic Strip */}
                        <div className="mt-6 h-12 w-full bg-black" />

                        {/* Signature Strip */}
                        <div className="mx-6 mt-6 h-10 rounded bg-white/90" />

                        {/* CVV */}
                        <div className="mx-6 mt-2 text-right">
                            <p className="text-xs opacity-75">CVV: •••</p>
                        </div>

                        {showBalance && card.type === 'credit' && (
                            <div className="mx-6 mt-auto mb-6">
                                <div className="rounded-lg bg-black/20 p-3">
                                    <p className="text-xs opacity-75">
                                        Balance
                                    </p>
                                    <p className="text-lg font-bold">
                                        {card.currency}{' '}
                                        {card.current_balance.toFixed(2)}
                                    </p>
                                    {card.credit_limit && (
                                        <p className="text-xs opacity-75">
                                            Available: {card.currency}{' '}
                                            {card.available_credit?.toFixed(2)} /{' '}
                                            {card.credit_limit.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </CardUI>
            </div>

            {/* Balance info below card */}
            {showBalance && card.type === 'credit' && (
                <div className="mt-2 text-center text-sm text-muted-foreground">
                    <p>
                        Balance: {card.currency} {card.current_balance.toFixed(2)}
                    </p>
                    {card.credit_limit && (
                        <p className="text-xs">
                            Available: {card.available_credit?.toFixed(2)} of{' '}
                            {card.credit_limit.toFixed(2)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function adjustColorBrightness(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const newR = Math.max(0, Math.min(255, r + amount));
    const newG = Math.max(0, Math.min(255, g + amount));
    const newB = Math.max(0, Math.min(255, b + amount));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function isLightColor(color: string): boolean {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
}
