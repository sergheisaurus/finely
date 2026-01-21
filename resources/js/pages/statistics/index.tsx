import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterPanel } from '@/components/statistics/filter-panel';
import { OverviewTab } from '@/components/statistics/tabs/overview-tab';
import { SpendingTab } from '@/components/statistics/tabs/spending-tab';
import { IncomeTab } from '@/components/statistics/tabs/income-tab';
import { BudgetsTab } from '@/components/statistics/tabs/budgets-tab';
import { AccountsTab } from '@/components/statistics/tabs/accounts-tab';
import { SubscriptionsTab } from '@/components/statistics/tabs/subscriptions-tab';
import { useStatisticsFilters } from '@/hooks/use-statistics-filters';
import { BarChart3 } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Statistics',
        href: '/statistics',
    },
];

export default function StatisticsPage() {
    const { filters, apiFilters, updateFilter, resetFilters } = useStatisticsFilters();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Statistics" />

            <div className="space-y-6 p-4 md:p-6">
                {/* Page Header */}
                <div className="animate-fade-in-up flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl dark:from-white dark:to-slate-400">
                            <BarChart3 className="inline-block h-7 w-7 mr-2 text-slate-900 dark:text-white" />
                            Statistics
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Comprehensive financial analytics and insights
                        </p>
                    </div>
                </div>

                {/* Filter Panel */}
                <FilterPanel
                    filters={filters}
                    onFilterChange={updateFilter}
                    onReset={resetFilters}
                />

                {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="spending">Spending</TabsTrigger>
                        <TabsTrigger value="income">Income</TabsTrigger>
                        <TabsTrigger value="budgets">Budgets</TabsTrigger>
                        <TabsTrigger value="accounts">Accounts</TabsTrigger>
                        <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <OverviewTab filters={filters} apiFilters={apiFilters} />
                    </TabsContent>

                    <TabsContent value="spending" className="space-y-6">
                        <SpendingTab filters={filters} apiFilters={apiFilters} />
                    </TabsContent>

                    <TabsContent value="income" className="space-y-6">
                        <IncomeTab filters={filters} apiFilters={apiFilters} />
                    </TabsContent>

                    <TabsContent value="budgets" className="space-y-6">
                        <BudgetsTab filters={filters} apiFilters={apiFilters} />
                    </TabsContent>

                    <TabsContent value="accounts" className="space-y-6">
                        <AccountsTab filters={filters} apiFilters={apiFilters} />
                    </TabsContent>

                    <TabsContent value="subscriptions" className="space-y-6">
                        <SubscriptionsTab filters={filters} apiFilters={apiFilters} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
