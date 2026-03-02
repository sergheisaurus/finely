import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Tabs } from '@base-ui/react';
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
                        <h1 className="text-2xl font-bold md:text-3xl text-white">
                            <BarChart3 className="inline-block h-7 w-7 mr-2 text-white" />
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
                <Tabs.Root defaultValue="overview" className="space-y-6">
                    <Tabs.List className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl w-fit overflow-x-auto mx-auto sm:mx-0 shadow-sm">
                        <Tabs.Tab value="overview" className="outline-none px-5 py-2 rounded-lg text-sm font-semibold transition-all text-slate-400 hover:text-white hover:bg-slate-800/50 data-[active]:bg-slate-800 data-[active]:text-white">Overview</Tabs.Tab>
                        <Tabs.Tab value="spending" className="outline-none px-5 py-2 rounded-lg text-sm font-semibold transition-all text-slate-400 hover:text-white hover:bg-slate-800/50 data-[active]:bg-slate-800 data-[active]:text-white">Spending</Tabs.Tab>
                        <Tabs.Tab value="income" className="outline-none px-5 py-2 rounded-lg text-sm font-semibold transition-all text-slate-400 hover:text-white hover:bg-slate-800/50 data-[active]:bg-slate-800 data-[active]:text-white">Income</Tabs.Tab>
                        <Tabs.Tab value="budgets" className="outline-none px-5 py-2 rounded-lg text-sm font-semibold transition-all text-slate-400 hover:text-white hover:bg-slate-800/50 data-[active]:bg-slate-800 data-[active]:text-white">Budgets</Tabs.Tab>
                        <Tabs.Tab value="accounts" className="outline-none px-5 py-2 rounded-lg text-sm font-semibold transition-all text-slate-400 hover:text-white hover:bg-slate-800/50 data-[active]:bg-slate-800 data-[active]:text-white">Accounts</Tabs.Tab>
                        <Tabs.Tab value="subscriptions" className="outline-none px-5 py-2 rounded-lg text-sm font-semibold transition-all text-slate-400 hover:text-white hover:bg-slate-800/50 data-[active]:bg-slate-800 data-[active]:text-white">Subscriptions</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="overview" className="space-y-6">
                        <OverviewTab filters={filters} apiFilters={apiFilters} />
                    </Tabs.Panel>

                    <Tabs.Panel value="spending" className="space-y-6">
                        <SpendingTab filters={filters} apiFilters={apiFilters} />
                    </Tabs.Panel>

                    <Tabs.Panel value="income" className="space-y-6">
                        <IncomeTab filters={filters} apiFilters={apiFilters} />
                    </Tabs.Panel>

                    <Tabs.Panel value="budgets" className="space-y-6">
                        <BudgetsTab filters={filters} apiFilters={apiFilters} />
                    </Tabs.Panel>

                    <Tabs.Panel value="accounts" className="space-y-6">
                        <AccountsTab filters={filters} apiFilters={apiFilters} />
                    </Tabs.Panel>

                    <Tabs.Panel value="subscriptions" className="space-y-6">
                        <SubscriptionsTab filters={filters} apiFilters={apiFilters} />
                    </Tabs.Panel>
                </Tabs.Root>
            </div>
        </AppLayout>
    );
}
