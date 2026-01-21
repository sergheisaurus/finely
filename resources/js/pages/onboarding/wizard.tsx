import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { User } from '@/types';
import type { BankAccount, Card, Category, Merchant } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

// Create axios instance for onboarding routes (web routes, not API routes)
const http = axios.create({
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
    },
});

// Add CSRF token to all requests
http.interceptors.request.use((config) => {
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    }
    return config;
});

import BankAccountStep from './steps/bank-account';
import CardsStep from './steps/cards';
import CompletionStep from './steps/completion';
import RecurringIncomeStep from './steps/recurring-income';
import SubscriptionsStep from './steps/subscriptions';
import WelcomeStep from './steps/welcome';

interface OnboardingProps {
    user: User;
    accounts: BankAccount[];
    cards: Card[];
    categories: Category[];
    merchants: Merchant[];
}

type OnboardingStep =
    | 'welcome'
    | 'bank-account'
    | 'cards'
    | 'subscriptions'
    | 'income'
    | 'completion';

const STEPS: OnboardingStep[] = [
    'welcome',
    'bank-account',
    'cards',
    'subscriptions',
    'income',
    'completion',
];

interface WizardData {
    account: BankAccount | null;
    cards: Card[];
    subscriptions: unknown[];
    incomes: unknown[];
}

export default function OnboardingWizard({
    user,
    accounts,
    cards,
    categories,
    merchants,
}: OnboardingProps) {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [wizardData, setWizardData] = useState<WizardData>({
        account: accounts[0] || null,
        cards: cards || [],
        subscriptions: [],
        incomes: [],
    });

    const currentIndex = STEPS.indexOf(currentStep);
    const progress = (currentIndex / (STEPS.length - 1)) * 100;

    const goToNext = () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < STEPS.length) {
            setCurrentStep(STEPS[nextIndex]);
        }
    };

    const goToPrevious = () => {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(STEPS[prevIndex]);
        }
    };

    const handleAccountSubmit = async (
        accountData: Record<string, unknown>,
    ) => {
        setIsSubmitting(true);
        try {
            const response = await http.post(
                '/onboarding/account',
                accountData,
            );
            setWizardData((prev) => ({
                ...prev,
                account: response.data.account,
            }));
            toast.success('Bank account created!');
            goToNext();
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string[]> } };
            };
            if (err.response?.data?.errors) {
                const firstError = Object.values(err.response.data.errors)[0];
                toast.error(
                    Array.isArray(firstError) ? firstError[0] : firstError,
                );
            } else {
                toast.error('Failed to create bank account');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCardsSubmit = async (cardsData: Card[]) => {
        setIsSubmitting(true);
        try {
            const response = await http.post('/onboarding/cards', {
                cards: cardsData,
            });
            setWizardData((prev) => ({
                ...prev,
                cards: response.data.cards || cardsData,
            }));
            if (cardsData.length > 0) {
                toast.success(`${cardsData.length} card(s) added!`);
            }
            goToNext();
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string[]> } };
            };
            if (err.response?.data?.errors) {
                const firstError = Object.values(err.response.data.errors)[0];
                toast.error(
                    Array.isArray(firstError) ? firstError[0] : firstError,
                );
            } else {
                toast.error('Failed to save cards');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubscriptionsSubmit = async (subscriptionsData: unknown[]) => {
        setIsSubmitting(true);
        try {
            await http.post('/onboarding/subscriptions', {
                subscriptions: subscriptionsData,
            });
            setWizardData((prev) => ({
                ...prev,
                subscriptions: subscriptionsData,
            }));
            if (subscriptionsData.length > 0) {
                toast.success(
                    `${subscriptionsData.length} subscription(s) added!`,
                );
            }
            goToNext();
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string[]> } };
            };
            if (err.response?.data?.errors) {
                const firstError = Object.values(err.response.data.errors)[0];
                toast.error(
                    Array.isArray(firstError) ? firstError[0] : firstError,
                );
            } else {
                toast.error('Failed to save subscriptions');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIncomesSubmit = async (incomesData: unknown[]) => {
        setIsSubmitting(true);
        try {
            await http.post('/onboarding/incomes', { incomes: incomesData });
            setWizardData((prev) => ({ ...prev, incomes: incomesData }));
            if (incomesData.length > 0) {
                toast.success(`${incomesData.length} income source(s) added!`);
            }
            goToNext();
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string[]> } };
            };
            if (err.response?.data?.errors) {
                const firstError = Object.values(err.response.data.errors)[0];
                toast.error(
                    Array.isArray(firstError) ? firstError[0] : firstError,
                );
            } else {
                toast.error('Failed to save income sources');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            const response = await http.post('/onboarding/complete');
            toast.success('Setup complete!');
            router.visit(response.data.redirect);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(
                err.response?.data?.message || 'Failed to complete setup',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        setIsSubmitting(true);
        try {
            const response = await http.post('/onboarding/skip');
            toast.success('Onboarding skipped');
            router.visit(response.data.redirect);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(
                err.response?.data?.message || 'Failed to skip onboarding',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'welcome':
                return (
                    <WelcomeStep
                        user={user}
                        onNext={goToNext}
                        onSkip={handleSkip}
                        isSkipping={isSubmitting}
                    />
                );
            case 'bank-account':
                return (
                    <BankAccountStep
                        onSubmit={handleAccountSubmit}
                        isSubmitting={isSubmitting}
                    />
                );
            case 'cards':
                return (
                    <CardsStep
                        accounts={
                            wizardData.account ? [wizardData.account] : accounts
                        }
                        onSubmit={handleCardsSubmit}
                        onSkip={() => handleCardsSubmit([])}
                        isSubmitting={isSubmitting}
                    />
                );
            case 'subscriptions':
                return (
                    <SubscriptionsStep
                        accounts={
                            wizardData.account ? [wizardData.account] : accounts
                        }
                        cards={wizardData.cards}
                        categories={categories.filter(
                            (c) => c.type === 'expense',
                        )}
                        merchants={merchants}
                        onSubmit={handleSubscriptionsSubmit}
                        onSkip={() => handleSubscriptionsSubmit([])}
                        isSubmitting={isSubmitting}
                    />
                );
            case 'income':
                return (
                    <RecurringIncomeStep
                        accounts={
                            wizardData.account ? [wizardData.account] : accounts
                        }
                        categories={categories.filter(
                            (c) => c.type === 'income',
                        )}
                        onSubmit={handleIncomesSubmit}
                        onSkip={() => handleIncomesSubmit([])}
                        isSubmitting={isSubmitting}
                    />
                );
            case 'completion':
                return (
                    <CompletionStep
                        wizardData={wizardData}
                        onComplete={handleComplete}
                        isSubmitting={isSubmitting}
                    />
                );
        }
    };

    const showProgress =
        currentStep !== 'welcome' && currentStep !== 'completion';
    const showBackButton =
        currentStep !== 'welcome' &&
        currentStep !== 'completion' &&
        currentStep !== 'bank-account';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <Head title="Welcome to Finely" />

            <div className="mx-auto max-w-3xl px-4 py-8">
                {showProgress && (
                    <div className="mb-8">
                        <Progress value={progress} className="h-2" />
                        <p className="mt-2 text-center text-sm text-muted-foreground">
                            Step {currentIndex} of {STEPS.length - 2}
                        </p>
                    </div>
                )}

                {renderStep()}

                {showBackButton && (
                    <div className="mt-6">
                        <Button
                            variant="ghost"
                            onClick={goToPrevious}
                            disabled={isSubmitting}
                        >
                            Back
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
