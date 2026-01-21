import { useCallback, useEffect, useMemo, useState } from 'react';

export interface StatisticsFilters {
    date_preset: string;
    date_from: string | null;
    date_to: string | null;
    category_ids: number[];
    merchant_ids: number[];
    account_ids: number[];
    card_ids: number[];
    type: string[];
    group_by: 'day' | 'week' | 'month' | 'quarter' | 'year';
    compare_to_previous: boolean;
}

const DEFAULT_FILTERS: StatisticsFilters = {
    date_preset: 'last_30_days',
    date_from: null,
    date_to: null,
    category_ids: [],
    merchant_ids: [],
    account_ids: [],
    card_ids: [],
    type: [],
    group_by: 'month',
    compare_to_previous: false,
};

// Parse URL query params
function parseQueryParams(): Partial<StatisticsFilters> {
    const params = new URLSearchParams(window.location.search);
    const parsed: Partial<StatisticsFilters> = {};

    const datePreset = params.get('date_preset');
    if (datePreset) parsed.date_preset = datePreset;

    const dateFrom = params.get('date_from');
    if (dateFrom) parsed.date_from = dateFrom;

    const dateTo = params.get('date_to');
    if (dateTo) parsed.date_to = dateTo;

    const categoryIds = params.get('category_ids');
    if (categoryIds) parsed.category_ids = categoryIds.split(',').map(Number);

    const merchantIds = params.get('merchant_ids');
    if (merchantIds) parsed.merchant_ids = merchantIds.split(',').map(Number);

    const accountIds = params.get('account_ids');
    if (accountIds) parsed.account_ids = accountIds.split(',').map(Number);

    const cardIds = params.get('card_ids');
    if (cardIds) parsed.card_ids = cardIds.split(',').map(Number);

    const type = params.get('type');
    if (type) parsed.type = type.split(',');

    const groupBy = params.get('group_by');
    if (groupBy) parsed.group_by = groupBy as StatisticsFilters['group_by'];

    const compareToPrevious = params.get('compare_to_previous');
    if (compareToPrevious)
        parsed.compare_to_previous = compareToPrevious === 'true';

    return parsed;
}

// Build query string from filters
function buildQueryString(filters: StatisticsFilters): string {
    const params = new URLSearchParams();

    if (filters.date_preset && filters.date_preset !== 'custom') {
        params.set('date_preset', filters.date_preset);
    }

    if (filters.date_from) {
        params.set('date_from', filters.date_from);
    }

    if (filters.date_to) {
        params.set('date_to', filters.date_to);
    }

    if (filters.category_ids.length > 0) {
        params.set('category_ids', filters.category_ids.join(','));
    }

    if (filters.merchant_ids.length > 0) {
        params.set('merchant_ids', filters.merchant_ids.join(','));
    }

    if (filters.account_ids.length > 0) {
        params.set('account_ids', filters.account_ids.join(','));
    }

    if (filters.card_ids.length > 0) {
        params.set('card_ids', filters.card_ids.join(','));
    }

    if (filters.type.length > 0) {
        params.set('type', filters.type.join(','));
    }

    params.set('group_by', filters.group_by);
    params.set('compare_to_previous', String(filters.compare_to_previous));

    return params.toString();
}

export function useStatisticsFilters() {
    const [filters, setFiltersState] = useState<StatisticsFilters>(() => ({
        ...DEFAULT_FILTERS,
        ...parseQueryParams(),
    }));

    // Update URL when filters change
    useEffect(() => {
        const queryString = buildQueryString(filters);
        const newUrl = `${window.location.pathname}${queryString ? '?' + queryString : ''}`;

        if (window.location.search !== '?' + queryString) {
            window.history.pushState({}, '', newUrl);
        }

        // Store in localStorage for persistence
        localStorage.setItem('statistics_filters', JSON.stringify(filters));
    }, [filters]);

    const updateFilter = useCallback(
        <K extends keyof StatisticsFilters>(
            key: K,
            value: StatisticsFilters[K],
        ) => {
            setFiltersState((prev) => ({ ...prev, [key]: value }));
        },
        [],
    );

    const updateFilters = useCallback((updates: Partial<StatisticsFilters>) => {
        setFiltersState((prev) => ({ ...prev, ...updates }));
    }, []);

    const resetFilters = useCallback(() => {
        setFiltersState(DEFAULT_FILTERS);
    }, []);

    // Get API-compatible filter object
    const apiFilters = useMemo(() => {
        const result: Record<string, unknown> = {};

        if (filters.date_preset && filters.date_preset !== 'custom') {
            result.date_preset = filters.date_preset;
        }

        if (filters.date_from) {
            result.date_from = filters.date_from;
        }

        if (filters.date_to) {
            result.date_to = filters.date_to;
        }

        if (filters.category_ids.length > 0) {
            result.category_id = filters.category_ids;
        }

        if (filters.merchant_ids.length > 0) {
            result.merchant_id = filters.merchant_ids;
        }

        if (filters.account_ids.length > 0) {
            result.account_id = filters.account_ids;
        }

        if (filters.card_ids.length > 0) {
            result.card_id = filters.card_ids;
        }

        if (filters.type.length > 0) {
            result.type = filters.type;
        }

        result.group_by = filters.group_by;
        result.compare_to_previous = filters.compare_to_previous;

        return result;
    }, [filters]);

    return {
        filters,
        apiFilters,
        updateFilter,
        updateFilters,
        resetFilters,
    };
}
