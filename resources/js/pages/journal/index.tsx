import { TransactionList } from '@/components/finance/transaction-list';
import { Button } from '@/components/ui/button';
import {
    CardContent,
    CardHeader,
    CardTitle,
    Card as CardUI,
} from '@/components/ui/card';
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
import { journal } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import type {
    BankAccount,
    Card,
    Category,
    Merchant,
    Transaction,
} from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { Filter, Plus, Search, X } from 'lucide-react';
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
    const [showFilters, setShowFilters] = useState(false);

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
            setTransactions(response.data.data);
            setLastPage(response.data.meta?.last_page || 1);
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
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    }, []);

    const fetchCards = useCallback(async () => {
        try {
            const response = await api.get('/cards');
            setCards(response.data.data);
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        }
    }, [setCards]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, []);

    const fetchMerchants = useCallback(async () => {
        try {
            const response = await api.get('/merchants');
            setMerchants(response.data.data);
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
        router.visit(`/journal/${transaction.id}/edit`);
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
            <div className="space-y-6 p-4 md:p-6">
                <div className="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl dark:from-white dark:to-slate-400">
                            Transaction Journal
                        </h1>
                        <p className="text-muted-foreground">
                            Track and manage all your transactions
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/journal/create')}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl hover:shadow-emerald-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Transaction
                    </Button>
                </div>

                <CardUI className="animate-fade-in-up stagger-1 overflow-hidden opacity-0">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-muted-foreground" />
                                Filters
                            </CardTitle>
                            <div className="flex gap-2">
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    {showFilters ? 'Hide' : 'Show'} Filters
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {showFilters && (
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search transactions..."
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Type
                                    </label>
                                    <Select
                                        value={typeFilter}
                                        onValueChange={setTypeFilter}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All types
                                            </SelectItem>
                                            <SelectItem value="income">
                                                Income
                                            </SelectItem>
                                            <SelectItem value="expense">
                                                Expense
                                            </SelectItem>
                                            <SelectItem value="transfer">
                                                Transfer
                                            </SelectItem>
                                            <SelectItem value="card_payment">
                                                Card Payment
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Category
                                    </label>
                                    <Select
                                        value={categoryFilter}
                                        onValueChange={setCategoryFilter}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All categories
                                            </SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id.toString()}
                                                >
                                                    {category.parent && '└ '}
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Merchant
                                    </label>
                                    <Select
                                        value={merchantFilter}
                                        onValueChange={setMerchantFilter}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All merchants" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All merchants
                                            </SelectItem>
                                            {merchants.map((merchant) => (
                                                <SelectItem
                                                    key={merchant.id}
                                                    value={merchant.id.toString()}
                                                >
                                                    {merchant.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Account
                                    </label>
                                    <Select
                                        value={accountFilter}
                                        onValueChange={setAccountFilter}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All accounts" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All accounts
                                            </SelectItem>
                                            {accounts.map((account) => (
                                                <SelectItem
                                                    key={account.id}
                                                    value={account.id.toString()}
                                                >
                                                    {account.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Date Range
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) =>
                                                setDateFrom(e.target.value)
                                            }
                                            placeholder="From"
                                        />
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) =>
                                                setDateTo(e.target.value)
                                            }
                                            placeholder="To"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </CardUI>

                <CardUI className="animate-fade-in-up stagger-2 overflow-hidden opacity-0">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
                        <CardTitle className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                                <Search className="h-4 w-4 text-emerald-500" />
                            </div>
                            Transactions
                            {!isLoading && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({transactions.length} results)
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <TransactionList
                            transactions={transactions}
                            isLoading={isLoading}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />

                        {!isLoading &&
                            transactions.length > 0 &&
                            lastPage > 1 && (
                                <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.max(1, prev - 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="hover-lift w-full sm:w-auto"
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
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
                                        className="hover-lift w-full sm:w-auto"
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                    </CardContent>
                </CardUI>
            </div>
        </AppLayout>
    );
}
