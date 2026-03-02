import { FilterPanel } from '@/components/statistics/filter-panel';
import { AccountsTab } from '@/components/statistics/tabs/accounts-tab';
import { BudgetsTab } from '@/components/statistics/tabs/budgets-tab';
import { ForecastTab } from '@/components/statistics/tabs/forecast-tab';
import { IncomeTab } from '@/components/statistics/tabs/income-tab';
import { OverviewTab } from '@/components/statistics/tabs/overview-tab';
import { SpendingTab } from '@/components/statistics/tabs/spending-tab';
import { SubscriptionsTab } from '@/components/statistics/tabs/subscriptions-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStatisticsFilters } from '@/hooks/use-statistics-filters';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    BarChart3,
    CalendarClock,
    Layers3,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Statistics',
        href: '/statistics',
    },
];

export default function StatisticsPage({
    overviewData,
}: {
    overviewData?: any; // We'll type this properly in the tab
}) {
    const { filters, apiFilters, updateFilter, resetFilters } =
        useStatisticsFilters();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Statistics" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-5 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/50">
                                <BarChart3 className="h-3.5 w-3.5" />
                                Analytics
                            </div>
                            <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                                Statistics
                            </h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                Filter, search, and slice your finances across
                                time, accounts, categories, and merchants.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <div className="inline-flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2 text-sm backdrop-blur supports-[backdrop-filter]:bg-background/50">
                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-semibold">Income</span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2 text-sm backdrop-blur supports-[backdrop-filter]:bg-background/50">
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <span className="font-semibold">Spending</span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2 text-sm backdrop-blur supports-[backdrop-filter]:bg-background/50">
                                <Wallet className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                <span className="font-semibold">Net worth</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modes */}
                <Tabs defaultValue="analyze" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 gap-1 lg:inline-grid lg:w-auto">
                        <TabsTrigger value="analyze" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analyze
                        </TabsTrigger>
                        <TabsTrigger value="plan" className="gap-2">
                            <CalendarClock className="h-4 w-4" />
                            Plan
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="analyze" className="space-y-6">
                        <FilterPanel
                            filters={filters}
                            onFilterChange={updateFilter}
                            onReset={resetFilters}
                        />

                        <Tabs defaultValue="overview" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3 gap-1 lg:inline-grid lg:w-auto lg:grid-cols-6">
                                <TabsTrigger value="overview" className="gap-2">
                                    <Layers3 className="h-4 w-4" />
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="spending" className="gap-2">
                                    <TrendingDown className="h-4 w-4" />
                                    Spending
                                </TabsTrigger>
                                <TabsTrigger value="income" className="gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Income
                                </TabsTrigger>
                                <TabsTrigger value="budgets">
                                    Budgets
                                </TabsTrigger>
                                <TabsTrigger value="accounts">
                                    Accounts
                                </TabsTrigger>
                                <TabsTrigger value="subscriptions">
                                    Subscriptions
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6">
                                <OverviewTab
                                    filters={filters}
                                    apiFilters={apiFilters}
                                    initialData={overviewData}
                                />
                            </TabsContent>

                            <TabsContent value="spending" className="space-y-6">
                                <SpendingTab
                                    filters={filters}
                                    apiFilters={apiFilters}
                                />
                            </TabsContent>

                            <TabsContent value="income" className="space-y-6">
                                <IncomeTab
                                    filters={filters}
                                    apiFilters={apiFilters}
                                />
                            </TabsContent>

                            <TabsContent value="budgets" className="space-y-6">
                                <BudgetsTab
                                    filters={filters}
                                    apiFilters={apiFilters}
                                />
                            </TabsContent>

                            <TabsContent value="accounts" className="space-y-6">
                                <AccountsTab
                                    filters={filters}
                                    apiFilters={apiFilters}
                                />
                            </TabsContent>

                            <TabsContent
                                value="subscriptions"
                                className="space-y-6"
                            >
                                <SubscriptionsTab
                                    filters={filters}
                                    apiFilters={apiFilters}
                                />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    <TabsContent value="plan" className="space-y-6">
                        <ForecastTab />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
