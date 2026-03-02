import { CategorySelect } from '@/components/finance/category-select';
import { MerchantSelect } from '@/components/finance/merchant-select';
import { TransactionFormModal } from '@/components/finance/transaction-form-modal';
import { TransactionList } from '@/components/finance/transaction-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { journal } from '@/routes/pages';
import { useSecretStore } from '@/stores/useSecretStore';
import { type BreadcrumbItem } from '@/types';
import type {
    BankAccount,
    Card,
    Category,
    Merchant,
    Transaction,
} from '@/types/finance';
import { Menu } from '@base-ui/react';
import { Head } from '@inertiajs/react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Journal',
        href: journal().url,
    },
];

export default function JournalIndex() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [, setCards] = useState<Card[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isSecretModeActive } = useSecretStore();

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editTransaction, setEditTransaction] = useState<Transaction | null>(
        null,
    );

    // Filter states
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [merchantFilter, setMerchantFilter] = useState<string>('all');
    const [accountFilter, setAccountFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [perPage] = useState(15);

    const fetchTransactions = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('per_page', perPage.toString());
            params.append('sort_by', 'transaction_date');
            params.append('sort_dir', 'desc');

            if (search) params.append('search', search);
            if (typeFilter !== 'all') params.append('type', typeFilter);
            if (categoryFilter !== 'all')
                params.append('category_id', categoryFilter);
            if (merchantFilter !== 'all')
                params.append('merchant_id', merchantFilter);
            if (accountFilter !== 'all') {
                params.append('account_id', accountFilter);
            }
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const response = await api.get(
                `/transactions?${params.toString()}`,
            );
            setTransactions(response?.data?.data || []);
            setLastPage(response?.data?.meta?.last_page || 1);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    }, [
        search,
        typeFilter,
        categoryFilter,
        merchantFilter,
        accountFilter,
        dateFrom,
        dateTo,
        currentPage,
        perPage,
    ]);

    const fetchAccounts = useCallback(async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    }, []);

    const fetchCards = useCallback(async () => {
        try {
            const response = await api.get('/cards');
            setCards(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        }
    }, [setCards]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, []);

    const fetchMerchants = useCallback(async () => {
        try {
            const response = await api.get('/merchants');
            setMerchants(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                fetchTransactions(),
                fetchAccounts(),
                fetchCards(),
                fetchCategories(),
                fetchMerchants(),
            ]);
            setIsLoading(false);
        };
        loadData();
    }, [
        fetchTransactions,
        fetchAccounts,
        fetchCards,
        fetchCategories,
        fetchMerchants,
    ]);

    const handleEdit = (transaction: Transaction) => {
        setEditTransaction(transaction);
    };

    const handleDelete = async (transaction: Transaction) => {
        if (
            !confirm(
                `Are you sure you want to delete "${transaction.title}"? This action cannot be undone.`,
            )
        ) {
            return;
        }

        try {
            await api.delete(`/transactions/${transaction.id}`);
            toast.success('Transaction deleted!', {
                description: `${transaction.title} has been removed.`,
            });
            await fetchTransactions();
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            toast.error('Failed to delete transaction', {
                description: 'Please try again.',
            });
        }
    };

    const clearFilters = () => {
        setSearch('');
        setTypeFilter('all');
        setCategoryFilter('all');
        setMerchantFilter('all');
        setAccountFilter('all');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
    };

    const hasActiveFilters =
        search ||
        typeFilter !== 'all' ||
        categoryFilter !== 'all' ||
        merchantFilter !== 'all' ||
        accountFilter !== 'all' ||
        dateFrom ||
        dateTo;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Journal" />
            <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4 pb-0 md:p-6">
                <div className="animate-fade-in-up flex flex-none flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white md:text-3xl">
                            {isSecretModeActive ? (
                                <span className="text-fuchsia-400">
                                    Cum Diary 🔒
                                </span>
                            ) : (
                                'Transaction Journal'
                            )}
                        </h1>
                        <p className="text-muted-foreground">
                            {isSecretModeActive
                                ? 'Every depraved little thing you’ve bought'
                                : 'Track and manage all your transactions'}
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-emerald-500 text-white shadow-sm transition-colors hover:bg-emerald-600"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Transaction
                    </Button>
                </div>

                <div className="animate-fade-in-up stagger-1 mb-4 flex flex-none flex-col items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 opacity-0 shadow-sm md:flex-row">
                    <div className="relative w-full flex-1 md:w-auto">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search transactions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border-slate-800 bg-slate-950/50 pl-9"
                        />
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                        <Select
                            value={typeFilter}
                            onValueChange={setTypeFilter}
                        >
                            <SelectTrigger className="h-9 w-[130px] border-slate-800 bg-slate-950/50">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="transfer">
                                    Transfer
                                </SelectItem>
                                <SelectItem value="card_payment">
                                    Card Payment
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <CategorySelect
                            value={categoryFilter}
                            onValueChange={setCategoryFilter}
                            categories={categories}
                            allowCreate={false}
                            placeholder="All categories"
                            specialOptions={[
                                { value: 'all', label: 'All categories' },
                            ]}
                            triggerClassName="w-[150px] bg-slate-950/50 border-slate-800 h-9"
                        />

                        <Menu.Root>
                            <Menu.Trigger className="flex h-9 items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none sm:w-[150px]">
                                <span className="truncate">More Filters</span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Menu.Trigger>
                            <Menu.Portal>
                                <Menu.Positioner
                                    align="end"
                                    sideOffset={8}
                                    className="z-50 outline-none"
                                >
                                    <Menu.Popup className="min-w-[250px] origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-200 shadow-xl transition-[transform,opacity] outline-none data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
                                        <div className="space-y-4 p-2">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Merchant
                                                </label>
                                                <MerchantSelect
                                                    value={merchantFilter}
                                                    onValueChange={
                                                        setMerchantFilter
                                                    }
                                                    merchants={merchants}
                                                    allowCreate={false}
                                                    placeholder="All merchants"
                                                    specialOptions={[
                                                        {
                                                            value: 'all',
                                                            label: 'All merchants',
                                                        },
                                                    ]}
                                                    triggerClassName="w-full bg-slate-950 border-slate-800 h-8 text-xs"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Account
                                                </label>
                                                <Select
                                                    value={accountFilter}
                                                    onValueChange={
                                                        setAccountFilter
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-full border-slate-800 bg-slate-950 text-xs">
                                                        <SelectValue placeholder="All accounts" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">
                                                            All accounts
                                                        </SelectItem>
                                                        {accounts.map(
                                                            (account) => (
                                                                <SelectItem
                                                                    key={
                                                                        account.id
                                                                    }
                                                                    value={account.id.toString()}
                                                                >
                                                                    {
                                                                        account.name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Date Range
                                                </label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="date"
                                                        value={dateFrom}
                                                        onChange={(e) =>
                                                            setDateFrom(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-8 border-slate-800 bg-slate-950 text-xs"
                                                    />
                                                    <Input
                                                        type="date"
                                                        value={dateTo}
                                                        onChange={(e) =>
                                                            setDateTo(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-8 border-slate-800 bg-slate-950 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Menu.Popup>
                                </Menu.Positioner>
                            </Menu.Portal>
                        </Menu.Root>

                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-9 px-2 text-muted-foreground hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="animate-fade-in-up stagger-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 pb-6 opacity-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-track]:bg-transparent">
                    <TransactionList
                        transactions={transactions}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />

                    {!isLoading && transactions.length > 0 && lastPage > 1 && (
                        <div className="flex flex-col items-center justify-between gap-3 py-4 sm:flex-row">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(1, prev - 1),
                                    )
                                }
                                disabled={currentPage === 1}
                                className="hover-lift w-full border-slate-800 bg-slate-900 sm:w-auto"
                            >
                                Previous
                            </Button>
                            <span className="rounded-full border border-slate-800 bg-slate-900/50 px-4 py-1.5 text-sm text-muted-foreground">
                                Page {currentPage} of {lastPage}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(lastPage, prev + 1),
                                    )
                                }
                                disabled={currentPage === lastPage}
                                className="hover-lift w-full border-slate-800 bg-slate-900 sm:w-auto"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create modal */}
            <TransactionFormModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSuccess={fetchTransactions}
            />

            {/* Edit modal */}
            <TransactionFormModal
                open={!!editTransaction}
                onOpenChange={(v) => {
                    if (!v) setEditTransaction(null);
                }}
                transaction={editTransaction}
                onSuccess={fetchTransactions}
            />
        </AppLayout>
    );
}
