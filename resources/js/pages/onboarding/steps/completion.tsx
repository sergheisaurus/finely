import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { BankAccount, Card as CardType } from '@/types/finance';
import {
    ArrowRight,
    Banknote,
    CheckCircle,
    CreditCard,
    Receipt,
    Wallet,
} from 'lucide-react';

interface WizardData {
    account: BankAccount | null;
    cards: CardType[];
    subscriptions: unknown[];
    incomes: unknown[];
}

interface CompletionStepProps {
    wizardData: WizardData;
    onComplete: () => Promise<void>;
    isSubmitting: boolean;
}

export default function CompletionStep({
    wizardData,
    onComplete,
    isSubmitting,
}: CompletionStepProps) {
    const { account, cards, subscriptions, incomes } = wizardData;

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <Card className="w-full max-w-lg text-center">
                <CardHeader className="pb-4">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600">
                        <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl">All Set!</CardTitle>
                    <CardDescription className="text-lg">
                        Your account is ready to track your finances.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3 text-left">
                        {account && (
                            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                                    <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Bank Account</p>
                                    <p className="text-sm text-muted-foreground">
                                        {account.name} &bull;{' '}
                                        {new Intl.NumberFormat('de-CH', {
                                            style: 'currency',
                                            currency: account.currency,
                                        }).format(account.balance)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {cards.length > 0 && (
                            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Cards</p>
                                    <p className="text-sm text-muted-foreground">
                                        {cards.length} card
                                        {cards.length !== 1 ? 's' : ''} added
                                    </p>
                                </div>
                            </div>
                        )}

                        {subscriptions.length > 0 && (
                            <div className="flex items-center gap-3 rounded-lg bg-orange-50 p-3 dark:bg-orange-950">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                                    <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Subscriptions</p>
                                    <p className="text-sm text-muted-foreground">
                                        {subscriptions.length} subscription
                                        {subscriptions.length !== 1
                                            ? 's'
                                            : ''}{' '}
                                        tracked
                                    </p>
                                </div>
                            </div>
                        )}

                        {incomes.length > 0 && (
                            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                                    <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-medium">
                                        Recurring Income
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {incomes.length} income source
                                        {incomes.length !== 1 ? 's' : ''} added
                                    </p>
                                </div>
                            </div>
                        )}

                        {cards.length === 0 &&
                            subscriptions.length === 0 &&
                            incomes.length === 0 && (
                                <p className="py-2 text-center text-sm text-muted-foreground">
                                    You can add cards, subscriptions, and income
                                    sources later from the dashboard.
                                </p>
                            )}
                    </div>

                    <Button
                        size="lg"
                        onClick={onComplete}
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                        {isSubmitting ? 'Finishing...' : 'Go to Dashboard'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
