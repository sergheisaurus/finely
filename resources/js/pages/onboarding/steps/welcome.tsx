import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { User } from '@/types';
import {
    ArrowRight,
    Banknote,
    CreditCard,
    Receipt,
    Sparkles,
    Wallet,
} from 'lucide-react';

interface WelcomeStepProps {
    user: User;
    onNext: () => void;
    onSkip: () => void;
    isSkipping: boolean;
}

export default function WelcomeStep({
    user,
    onNext,
    onSkip,
    isSkipping,
}: WelcomeStepProps) {
    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <Card className="w-full max-w-lg text-center">
                <CardHeader className="pb-4">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                        <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl">
                        Welcome, {user.name}!
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Let's set up your financial tracking in just a few
                        steps.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    1. Create your bank account
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Add your first account with opening balance
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium">2. Add your cards</p>
                                <p className="text-sm text-muted-foreground">
                                    Link debit or credit cards (optional)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                                <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    3. Set up subscriptions
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Track recurring payments (optional)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                                <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    4. Add income sources
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Track salary and recurring income (optional)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            size="lg"
                            onClick={onNext}
                            disabled={isSkipping}
                            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                        >
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onSkip}
                            disabled={isSkipping}
                            className="text-muted-foreground"
                        >
                            {isSkipping ? 'Skipping...' : 'Skip for now'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
