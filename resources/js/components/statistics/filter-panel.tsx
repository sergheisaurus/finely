import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { StatisticsFilters } from '@/hooks/use-statistics-filters';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { BankAccount, Card, Category, Merchant } from '@/types/finance';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface FilterPanelProps {
    filters: StatisticsFilters;
    onFilterChange: <K extends keyof StatisticsFilters>(
        key: K,
        value: StatisticsFilters[K],
    ) => void;
    onReset: () => void;
}

const DATE_PRESETS = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'all_time', label: 'All Time' },
    { value: 'custom', label: 'Custom' },
];

const GROUP_BY_OPTIONS = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'year', label: 'Yearly' },
];

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'expense', label: 'Expenses' },
    { value: 'income', label: 'Income' },
    { value: 'transfer', label: 'Transfers' },
    { value: 'card_payment', label: 'Card payments' },
];

function uniqIds(ids: number[]): number[] {
    return Array.from(new Set(ids));
}

function toggleId(ids: number[], id: number): number[] {
    return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

function countActiveFilters(filters: StatisticsFilters): number {
    let count = 0;
    if (filters.q) count++;
    if (
        filters.date_preset === 'custom' &&
        (filters.date_from || filters.date_to)
    )
        count++;
    if (filters.category_ids.length) count++;
    if (filters.merchant_ids.length) count++;
    if (filters.account_ids.length) count++;
    if (filters.card_ids.length) count++;
    if (filters.type.length) count++;
    if (filters.amount_min !== null || filters.amount_max !== null) count++;
    if (filters.compare_to_previous) count++;
    return count;
}

export function FilterPanel({
    filters,
    onFilterChange,
    onReset,
}: FilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Search input is debounced so stats don't refetch on every keystroke.
    const [searchDraft, setSearchDraft] = useState(filters.q);
    useEffect(() => {
        setSearchDraft(filters.q);
    }, [filters.q]);

    useEffect(() => {
        const t = window.setTimeout(() => {
            if (searchDraft !== filters.q) {
                onFilterChange('q', searchDraft);
            }
        }, 450);

        return () => window.clearTimeout(t);
    }, [searchDraft, filters.q, onFilterChange]);

    const activeFiltersCount = useMemo(
        () => countActiveFilters(filters),
        [filters],
    );

    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [optionsLoaded, setOptionsLoaded] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const [accountQuery, setAccountQuery] = useState('');
    const [cardQuery, setCardQuery] = useState('');
    const [categoryQuery, setCategoryQuery] = useState('');
    const [merchantQuery, setMerchantQuery] = useState('');

    useEffect(() => {
        if (!isOpen || optionsLoaded || loadingOptions) return;

        let cancelled = false;
        const load = async () => {
            setLoadingOptions(true);
            try {
                const [accountsRes, cardsRes, categoriesRes, merchantsRes] =
                    await Promise.all([
                        api.get('/accounts', { params: { per_page: 250 } }),
                        api.get('/cards', { params: { per_page: 250 } }),
                        api.get('/categories', { params: { per_page: 500 } }),
                        api.get('/merchants', { params: { per_page: 500 } }),
                    ]);

                if (cancelled) return;

                setAccounts(accountsRes.data.data || []);
                setCards(cardsRes.data.data || []);
                setCategories(categoriesRes.data.data || []);
                setMerchants(merchantsRes.data.data || []);
                setOptionsLoaded(true);
            } catch (error) {
                console.error(
                    'Failed to load statistics filter options:',
                    error,
                );
            } finally {
                if (!cancelled) setLoadingOptions(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [isOpen, optionsLoaded, loadingOptions]);

    const filteredAccounts = useMemo(() => {
        const q = accountQuery.trim().toLowerCase();
        if (!q) return accounts;
        return accounts.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                (a.bank_name || '').toLowerCase().includes(q),
        );
    }, [accounts, accountQuery]);

    const filteredCards = useMemo(() => {
        const q = cardQuery.trim().toLowerCase();
        if (!q) return cards;
        return cards.filter((c) =>
            `${c.card_holder_name} ${c.card_network} ${c.type}`
                .toLowerCase()
                .includes(q),
        );
    }, [cards, cardQuery]);

    const filteredCategories = useMemo(() => {
        const q = categoryQuery.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter((c) => c.name.toLowerCase().includes(q));
    }, [categories, categoryQuery]);

    const filteredMerchants = useMemo(() => {
        const q = merchantQuery.trim().toLowerCase();
        if (!q) return merchants;
        return merchants.filter((m) => m.name.toLowerCase().includes(q));
    }, [merchants, merchantQuery]);

    const selectedAccounts = useMemo(() => {
        if (filters.account_ids.length === 0) return [];
        const set = new Set(filters.account_ids);
        return accounts.filter((a) => set.has(a.id));
    }, [accounts, filters.account_ids]);

    const selectedCards = useMemo(() => {
        if (filters.card_ids.length === 0) return [];
        const set = new Set(filters.card_ids);
        return cards.filter((c) => set.has(c.id));
    }, [cards, filters.card_ids]);

    const selectedCategories = useMemo(() => {
        if (filters.category_ids.length === 0) return [];
        const set = new Set(filters.category_ids);
        return categories.filter((c) => set.has(c.id));
    }, [categories, filters.category_ids]);

    const selectedMerchants = useMemo(() => {
        if (filters.merchant_ids.length === 0) return [];
        const set = new Set(filters.merchant_ids);
        return merchants.filter((m) => set.has(m.id));
    }, [merchants, filters.merchant_ids]);

    return (
        <div className="space-y-3">
            <div className="rounded-xl border bg-card p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            placeholder="Search transactions (title/description)…"
                            className="pl-9"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={filters.date_preset}
                            onValueChange={(value) => {
                                onFilterChange('date_preset', value);
                                if (value !== 'custom') {
                                    onFilterChange('date_from', null);
                                    onFilterChange('date_to', null);
                                }
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                {DATE_PRESETS.map((preset) => (
                                    <SelectItem
                                        key={preset.value}
                                        value={preset.value}
                                    >
                                        {preset.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.group_by}
                            onValueChange={(value) =>
                                onFilterChange(
                                    'group_by',
                                    value as StatisticsFilters['group_by'],
                                )
                            }
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Group" />
                            </SelectTrigger>
                            <SelectContent>
                                {GROUP_BY_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline">
                                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                                    Filters
                                    {activeFiltersCount > 0 && (
                                        <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="sm:max-w-md">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        Advanced Filters
                                    </SheetTitle>
                                    <SheetDescription>
                                        Narrow down the data across charts.
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="flex-1 overflow-y-auto px-4 pb-4">
                                    <div className="space-y-6">
                                        <section className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold">
                                                    Period
                                                </h3>
                                                {filters.date_preset ===
                                                    'custom' &&
                                                    (filters.date_from ||
                                                        filters.date_to) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                onFilterChange(
                                                                    'date_from',
                                                                    null,
                                                                );
                                                                onFilterChange(
                                                                    'date_to',
                                                                    null,
                                                                );
                                                            }}
                                                            className="h-7 px-2 text-muted-foreground"
                                                        >
                                                            Clear
                                                        </Button>
                                                    )}
                                            </div>

                                            {filters.date_preset ===
                                                'custom' && (
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <p className="mb-1 text-xs text-muted-foreground">
                                                            From
                                                        </p>
                                                        <Input
                                                            type="date"
                                                            value={
                                                                filters.date_from ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                onFilterChange(
                                                                    'date_from',
                                                                    e.target
                                                                        .value ||
                                                                        null,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="mb-1 text-xs text-muted-foreground">
                                                            To
                                                        </p>
                                                        <Input
                                                            type="date"
                                                            value={
                                                                filters.date_to ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                onFilterChange(
                                                                    'date_to',
                                                                    e.target
                                                                        .value ||
                                                                        null,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </section>

                                        <section className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold">
                                                    Type
                                                </h3>
                                                {filters.type.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            onFilterChange(
                                                                'type',
                                                                [],
                                                            )
                                                        }
                                                        className="h-7 px-2 text-muted-foreground"
                                                    >
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>
                                            <ToggleGroup
                                                type="multiple"
                                                value={filters.type}
                                                onValueChange={(value) =>
                                                    onFilterChange(
                                                        'type',
                                                        value,
                                                    )
                                                }
                                                variant="outline"
                                                className="flex flex-wrap justify-start"
                                            >
                                                {TYPE_OPTIONS.map((t) => (
                                                    <ToggleGroupItem
                                                        key={t.value}
                                                        value={t.value}
                                                        className="text-xs"
                                                    >
                                                        {t.label}
                                                    </ToggleGroupItem>
                                                ))}
                                            </ToggleGroup>
                                        </section>

                                        <section className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold">
                                                    Amount
                                                </h3>
                                                {(filters.amount_min !== null ||
                                                    filters.amount_max !==
                                                        null) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            onFilterChange(
                                                                'amount_min',
                                                                null,
                                                            );
                                                            onFilterChange(
                                                                'amount_max',
                                                                null,
                                                            );
                                                        }}
                                                        className="h-7 px-2 text-muted-foreground"
                                                    >
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <p className="mb-1 text-xs text-muted-foreground">
                                                        Min
                                                    </p>
                                                    <Input
                                                        inputMode="decimal"
                                                        placeholder="0"
                                                        value={
                                                            filters.amount_min ===
                                                            null
                                                                ? ''
                                                                : String(
                                                                      filters.amount_min,
                                                                  )
                                                        }
                                                        onChange={(e) => {
                                                            const raw =
                                                                e.target.value;
                                                            const n =
                                                                raw.trim() ===
                                                                ''
                                                                    ? null
                                                                    : Number(
                                                                          raw,
                                                                      );
                                                            onFilterChange(
                                                                'amount_min',
                                                                Number.isFinite(
                                                                    n as number,
                                                                )
                                                                    ? (n as number)
                                                                    : null,
                                                            );
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-xs text-muted-foreground">
                                                        Max
                                                    </p>
                                                    <Input
                                                        inputMode="decimal"
                                                        placeholder="0"
                                                        value={
                                                            filters.amount_max ===
                                                            null
                                                                ? ''
                                                                : String(
                                                                      filters.amount_max,
                                                                  )
                                                        }
                                                        onChange={(e) => {
                                                            const raw =
                                                                e.target.value;
                                                            const n =
                                                                raw.trim() ===
                                                                ''
                                                                    ? null
                                                                    : Number(
                                                                          raw,
                                                                      );
                                                            onFilterChange(
                                                                'amount_max',
                                                                Number.isFinite(
                                                                    n as number,
                                                                )
                                                                    ? (n as number)
                                                                    : null,
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold">
                                                    Compare
                                                </h3>
                                            </div>

                                            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                                                <Checkbox
                                                    checked={
                                                        filters.compare_to_previous
                                                    }
                                                    onCheckedChange={(v) =>
                                                        onFilterChange(
                                                            'compare_to_previous',
                                                            Boolean(v),
                                                        )
                                                    }
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">
                                                        Compare to previous
                                                        period
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Show trends for income
                                                        and expenses.
                                                    </p>
                                                </div>
                                            </label>
                                        </section>

                                        <section className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold">
                                                    Accounts
                                                </h3>
                                                {filters.account_ids.length >
                                                    0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            onFilterChange(
                                                                'account_ids',
                                                                [],
                                                            )
                                                        }
                                                        className="h-7 px-2 text-muted-foreground"
                                                    >
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="relative">
                                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={accountQuery}
                                                    onChange={(e) =>
                                                        setAccountQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Search accounts…"
                                                    className="pl-9"
                                                />
                                            </div>

                                            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border p-2">
                                                {loadingOptions &&
                                                    accounts.length === 0 && (
                                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                                            Loading…
                                                        </p>
                                                    )}

                                                {filteredAccounts.length ===
                                                    0 &&
                                                    !loadingOptions && (
                                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                                            No matches.
                                                        </p>
                                                    )}

                                                {filteredAccounts.map(
                                                    (account) => (
                                                        <label
                                                            key={account.id}
                                                            className={cn(
                                                                'flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/40',
                                                                filters.account_ids.includes(
                                                                    account.id,
                                                                ) &&
                                                                    'bg-muted/30',
                                                            )}
                                                        >
                                                            <span className="truncate text-sm">
                                                                {account.name}
                                                            </span>
                                                            <Checkbox
                                                                checked={filters.account_ids.includes(
                                                                    account.id,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    onFilterChange(
                                                                        'account_ids',
                                                                        uniqIds(
                                                                            toggleId(
                                                                                filters.account_ids,
                                                                                account.id,
                                                                            ),
                                                                        ),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                    ),
                                                )}
                                            </div>
                                        </section>

                                        <section className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold">
                                                    Cards
                                                </h3>
                                                {filters.card_ids.length >
                                                    0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            onFilterChange(
                                                                'card_ids',
                                                                [],
                                                            )
                                                        }
                                                        className="h-7 px-2 text-muted-foreground"
                                                    >
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="relative">
                                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={cardQuery}
                                                    onChange={(e) =>
                                                        setCardQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Search cards…"
                                                    className="pl-9"
                                                />
                                            </div>

                                            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border p-2">
                                                {filteredCards.length === 0 &&
                                                    !loadingOptions && (
                                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                                            No matches.
                                                        </p>
                                                    )}

                                                {filteredCards.map((card) => (
                                                    <label
                                                        key={card.id}
                                                        className={cn(
                                                            'flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/40',
                                                            filters.card_ids.includes(
                                                                card.id,
                                                            ) && 'bg-muted/30',
                                                        )}
                                                    >
                                                        <span className="truncate text-sm">
                                                            {card.card_network}{' '}
                                                            {card.type}
                                                        </span>
                                                        <Checkbox
                                                            checked={filters.card_ids.includes(
                                                                card.id,
                                                            )}
                                                            onCheckedChange={() =>
                                                                onFilterChange(
                                                                    'card_ids',
                                                                    uniqIds(
                                                                        toggleId(
                                                                            filters.card_ids,
                                                                            card.id,
                                                                        ),
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold">
                                                    Categories
                                                </h3>
                                                {filters.category_ids.length >
                                                    0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            onFilterChange(
                                                                'category_ids',
                                                                [],
                                                            )
                                                        }
                                                        className="h-7 px-2 text-muted-foreground"
                                                    >
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="relative">
                                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={categoryQuery}
                                                    onChange={(e) =>
                                                        setCategoryQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Search categories…"
                                                    className="pl-9"
                                                />
                                            </div>

                                            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border p-2">
                                                {filteredCategories.length ===
                                                    0 &&
                                                    !loadingOptions && (
                                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                                            No matches.
                                                        </p>
                                                    )}

                                                {filteredCategories.map(
                                                    (cat) => (
                                                        <label
                                                            key={cat.id}
                                                            className={cn(
                                                                'flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/40',
                                                                filters.category_ids.includes(
                                                                    cat.id,
                                                                ) &&
                                                                    'bg-muted/30',
                                                            )}
                                                        >
                                                            <span className="truncate text-sm">
                                                                {cat.name}
                                                            </span>
                                                            <Checkbox
                                                                checked={filters.category_ids.includes(
                                                                    cat.id,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    onFilterChange(
                                                                        'category_ids',
                                                                        uniqIds(
                                                                            toggleId(
                                                                                filters.category_ids,
                                                                                cat.id,
                                                                            ),
                                                                        ),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                    ),
                                                )}
                                            </div>
                                        </section>

                                        <section className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold">
                                                    Merchants
                                                </h3>
                                                {filters.merchant_ids.length >
                                                    0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            onFilterChange(
                                                                'merchant_ids',
                                                                [],
                                                            )
                                                        }
                                                        className="h-7 px-2 text-muted-foreground"
                                                    >
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="relative">
                                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={merchantQuery}
                                                    onChange={(e) =>
                                                        setMerchantQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Search merchants…"
                                                    className="pl-9"
                                                />
                                            </div>

                                            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border p-2">
                                                {filteredMerchants.length ===
                                                    0 &&
                                                    !loadingOptions && (
                                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                                            No matches.
                                                        </p>
                                                    )}

                                                {filteredMerchants.map((m) => (
                                                    <label
                                                        key={m.id}
                                                        className={cn(
                                                            'flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/40',
                                                            filters.merchant_ids.includes(
                                                                m.id,
                                                            ) && 'bg-muted/30',
                                                        )}
                                                    >
                                                        <span className="truncate text-sm">
                                                            {m.name}
                                                        </span>
                                                        <Checkbox
                                                            checked={filters.merchant_ids.includes(
                                                                m.id,
                                                            )}
                                                            onCheckedChange={() =>
                                                                onFilterChange(
                                                                    'merchant_ids',
                                                                    uniqIds(
                                                                        toggleId(
                                                                            filters.merchant_ids,
                                                                            m.id,
                                                                        ),
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                <div className="border-t p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => onReset()}
                                            className="flex-1"
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Reset
                                        </Button>
                                        <Button
                                            onClick={() => setIsOpen(false)}
                                            className="flex-1"
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button variant="ghost" onClick={onReset}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2">
                    {filters.q && (
                        <Badge variant="secondary" className="gap-1">
                            <Search className="h-3.5 w-3.5" />
                            <span className="max-w-[240px] truncate">
                                {filters.q}
                            </span>
                            <button
                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                onClick={() => onFilterChange('q', '')}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    )}

                    {filters.type.map((t) => (
                        <Badge key={t} variant="secondary" className="gap-1">
                            {TYPE_OPTIONS.find((x) => x.value === t)?.label ||
                                t}
                            <button
                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                onClick={() =>
                                    onFilterChange(
                                        'type',
                                        filters.type.filter((x) => x !== t),
                                    )
                                }
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    ))}

                    {(filters.amount_min !== null ||
                        filters.amount_max !== null) && (
                        <Badge variant="secondary" className="gap-1">
                            Amount
                            <span className="text-muted-foreground">
                                {filters.amount_min !== null
                                    ? ` >= ${filters.amount_min}`
                                    : ''}
                                {filters.amount_max !== null
                                    ? ` <= ${filters.amount_max}`
                                    : ''}
                            </span>
                            <button
                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                onClick={() => {
                                    onFilterChange('amount_min', null);
                                    onFilterChange('amount_max', null);
                                }}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    )}

                    {selectedAccounts.map((a) => (
                        <Badge
                            key={`a-${a.id}`}
                            variant="secondary"
                            className="gap-1"
                        >
                            {a.name}
                            <button
                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                onClick={() =>
                                    onFilterChange(
                                        'account_ids',
                                        filters.account_ids.filter(
                                            (id) => id !== a.id,
                                        ),
                                    )
                                }
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    ))}

                    {selectedCards.map((c) => (
                        <Badge
                            key={`c-${c.id}`}
                            variant="secondary"
                            className="gap-1"
                        >
                            {c.card_network} {c.type}
                            <button
                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                onClick={() =>
                                    onFilterChange(
                                        'card_ids',
                                        filters.card_ids.filter(
                                            (id) => id !== c.id,
                                        ),
                                    )
                                }
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    ))}

                    {selectedCategories.map((c) => (
                        <Badge
                            key={`cat-${c.id}`}
                            variant="secondary"
                            className="gap-1"
                        >
                            {c.name}
                            <button
                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                onClick={() =>
                                    onFilterChange(
                                        'category_ids',
                                        filters.category_ids.filter(
                                            (id) => id !== c.id,
                                        ),
                                    )
                                }
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    ))}

                    {selectedMerchants.map((m) => (
                        <Badge
                            key={`m-${m.id}`}
                            variant="secondary"
                            className="gap-1"
                        >
                            {m.name}
                            <button
                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                onClick={() =>
                                    onFilterChange(
                                        'merchant_ids',
                                        filters.merchant_ids.filter(
                                            (id) => id !== m.id,
                                        ),
                                    )
                                }
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    ))}

                    {filters.compare_to_previous && (
                        <Badge variant="secondary" className="gap-1">
                            Compare
                            <button
                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                onClick={() =>
                                    onFilterChange('compare_to_previous', false)
                                }
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
