import { FilterPanel } from '@/components/statistics/filter-panel';
import { AccountsTab } from '@/components/statistics/tabs/accounts-tab';
import { BudgetsTab } from '@/components/statistics/tabs/budgets-tab';
import { IncomeTab } from '@/components/statistics/tabs/income-tab';
import { OverviewTab } from '@/components/statistics/tabs/overview-tab';
import { SpendingTab } from '@/components/statistics/tabs/spending-tab';
import { SubscriptionsTab } from '@/components/statistics/tabs/subscriptions-tab';
import { useStatisticsFilters } from '@/hooks/use-statistics-filters';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Tabs } from '@base-ui/react';
import { Head } from '@inertiajs/react';
import { BarChart3, Sparkles } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Statistics',
        href: '/statistics',
    },
];

export default function StatisticsPage() {
    const { filters, apiFilters, updateFilter, resetFilters } =
        useStatisticsFilters();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Statistics" />

            <div className="space-y-6 py-6 sm:space-y-8 sm:py-8">
                <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-white via-white to-emerald-50/70 px-5 py-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:px-6 sm:py-7 dark:from-card dark:via-card dark:to-emerald-950/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/85 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                <Sparkles className="h-3.5 w-3.5" />
                                Insight center
                            </div>
                            <div className="space-y-1">
                                <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                    <span className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                        <BarChart3 className="h-6 w-6" />
                                    </span>
                                    Statistics
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Explore trends, compare periods, and model
                                    future outcomes without the cramped dark UI.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:w-[22rem]">
                            <div className="rounded-[1.25rem] border border-border/70 bg-white/85 px-4 py-3 shadow-sm dark:bg-card/90">
                                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                    Views
                                </p>
                                <p className="mt-2 text-xl font-semibold text-foreground">
                                    6 tabs
                                </p>
                            </div>
                            <div className="rounded-[1.25rem] border border-border/70 bg-white/85 px-4 py-3 shadow-sm dark:bg-card/90">
                                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                    Scope
                                </p>
                                <p className="mt-2 text-xl font-semibold text-foreground">
                                    Full flow
                                </p>
                            </div>
                            <div className="rounded-[1.25rem] border border-border/70 bg-white/85 px-4 py-3 shadow-sm dark:bg-card/90">
                                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                    Forecast
                                </p>
                                <p className="mt-2 text-xl font-semibold text-foreground">
                                    What-if
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Filter Panel */}
                <FilterPanel
                    filters={filters}
                    onFilterChange={updateFilter}
                    onReset={resetFilters}
                />

                {/* Tabs */}
                <Tabs.Root defaultValue="overview" className="space-y-6">
                    <Tabs.List className="flex w-full gap-2 overflow-x-auto rounded-full border border-border/70 bg-card/80 p-1 shadow-sm sm:w-fit">
                        <Tabs.Tab
                            value="overview"
                            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition outline-none data-[active]:bg-primary data-[active]:text-primary-foreground"
                        >
                            Overview
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="spending"
                            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition outline-none data-[active]:bg-primary data-[active]:text-primary-foreground"
                        >
                            Spending
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="income"
                            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition outline-none data-[active]:bg-primary data-[active]:text-primary-foreground"
                        >
                            Income
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="budgets"
                            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition outline-none data-[active]:bg-primary data-[active]:text-primary-foreground"
                        >
                            Budgets
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="accounts"
                            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition outline-none data-[active]:bg-primary data-[active]:text-primary-foreground"
                        >
                            Accounts
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="subscriptions"
                            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition outline-none data-[active]:bg-primary data-[active]:text-primary-foreground"
                        >
                            Subscriptions
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="overview" className="space-y-6">
                        <OverviewTab
                            filters={filters}
                            apiFilters={apiFilters}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="spending" className="space-y-6">
                        <SpendingTab
                            filters={filters}
                            apiFilters={apiFilters}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="income" className="space-y-6">
                        <IncomeTab filters={filters} apiFilters={apiFilters} />
                    </Tabs.Panel>

                    <Tabs.Panel value="budgets" className="space-y-6">
                        <BudgetsTab filters={filters} apiFilters={apiFilters} />
                    </Tabs.Panel>

                    <Tabs.Panel value="accounts" className="space-y-6">
                        <AccountsTab
                            filters={filters}
                            apiFilters={apiFilters}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="subscriptions" className="space-y-6">
                        <SubscriptionsTab
                            filters={filters}
                            apiFilters={apiFilters}
                        />
                    </Tabs.Panel>
                </Tabs.Root>
            </div>
        </AppLayout>
    );
}
