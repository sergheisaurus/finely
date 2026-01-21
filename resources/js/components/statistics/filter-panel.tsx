import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { StatisticsFilters } from '@/hooks/use-statistics-filters';
import { RotateCcw } from 'lucide-react';

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
];

const GROUP_BY_OPTIONS = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'year', label: 'Yearly' },
];

export function FilterPanel({
    filters,
    onFilterChange,
    onReset,
}: FilterPanelProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Period:</span>
                <Select
                    value={filters.date_preset}
                    onValueChange={(value) =>
                        onFilterChange('date_preset', value)
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        {DATE_PRESETS.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value}>
                                {preset.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Group by:</span>
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
                        <SelectValue placeholder="Select grouping" />
                    </SelectTrigger>
                    <SelectContent>
                        {GROUP_BY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={onReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Filters
                </Button>
            </div>
        </div>
    );
}
