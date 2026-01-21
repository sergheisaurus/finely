import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    CreditCard,
    PiggyBank,
    Shield,
    Sparkles,
    TrendingUp,
    Wallet,
} from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
                {/* Navigation */}
                <header className="fixed top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/80">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                                <AppLogoIcon className="h-5 w-5" />
                            </div>
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-xl font-bold text-transparent">
                                Finely
                            </span>
                        </div>
                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30"
                                >
                                    Dashboard
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30"
                                        >
                                            Get Started
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
                    {/* Background decoration */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/20" />
                        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-900/20" />
                    </div>

                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                <Sparkles className="h-4 w-4" />
                                Personal Finance Made Simple
                            </div>
                            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                                Take control of your{' '}
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                                    finances
                                </span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
                                Track your income, expenses, and investments in
                                one beautiful place. Make smarter financial
                                decisions with powerful insights and reports.
                            </p>
                            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Link
                                    href={auth.user ? dashboard() : register()}
                                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-500/30"
                                >
                                    {auth.user
                                        ? 'Go to Dashboard'
                                        : 'Start for Free'}
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                                {!auth.user && (
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 lg:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Everything you need to manage money
                            </h2>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                                Powerful features to help you take control of
                                your finances
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: Wallet,
                                    title: 'Multiple Accounts',
                                    description:
                                        'Track all your bank accounts in one place with real-time balances.',
                                    color: 'from-blue-500 to-cyan-500',
                                },
                                {
                                    icon: CreditCard,
                                    title: 'Card Management',
                                    description:
                                        'Manage debit and credit cards with payment tracking and due dates.',
                                    color: 'from-purple-500 to-pink-500',
                                },
                                {
                                    icon: BarChart3,
                                    title: 'Transaction Journal',
                                    description:
                                        'Every transaction logged and categorized for complete visibility.',
                                    color: 'from-emerald-500 to-teal-500',
                                },
                                {
                                    icon: TrendingUp,
                                    title: 'Smart Categories',
                                    description:
                                        'Organize with hierarchical categories and subcategories.',
                                    color: 'from-orange-500 to-amber-500',
                                },
                                {
                                    icon: PiggyBank,
                                    title: 'Expense Tracking',
                                    description:
                                        'Track where your money goes with merchant and vendor management.',
                                    color: 'from-rose-500 to-red-500',
                                },
                                {
                                    icon: Shield,
                                    title: 'Secure & Private',
                                    description:
                                        'Your financial data stays safe with enterprise-grade security.',
                                    color: 'from-slate-500 to-slate-700',
                                },
                            ].map((feature, index) => (
                                <div
                                    key={index}
                                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div
                                        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}
                                    >
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 lg:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-16 text-center shadow-2xl sm:px-16 lg:py-24">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[size:24px_24px] opacity-20" />
                            <div className="relative">
                                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                                    Ready to take control?
                                </h2>
                                <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100">
                                    Start tracking your finances today. It's
                                    free, simple, and powerful.
                                </p>
                                <div className="mt-8">
                                    <Link
                                        href={
                                            auth.user ? dashboard() : register()
                                        }
                                        className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-emerald-600 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                                    >
                                        {auth.user
                                            ? 'Go to Dashboard'
                                            : 'Get Started Free'}
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-200 py-12 dark:border-slate-800">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                    <AppLogoIcon className="h-4 w-4" />
                                </div>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    Finely
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {new Date().getFullYear()} Finely. All rights
                                reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
