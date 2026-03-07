import { StatsCard } from '@/components/finance/stats-card';
import { BarChartCard } from '@/components/statistics/charts/bar-chart-card';
import { LineChartCard } from '@/components/statistics/charts/line-chart-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type {
    ForecastPoint,
    ForecastResponse,
    ScenarioItem,
} from '@/types/statistics';
import {
    Calendar,
    CirclePlus,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function formatIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

function findPointAtOrBefore(
    points: ForecastPoint[],
    date: string,
): ForecastPoint | null {
    if (points.length === 0) return null;
    // points are returned sorted by date asc
    for (let i = points.length - 1; i >= 0; i--) {
        if (points[i].date <= date) return points[i];
    }
    return points[0];
}

type MonthlySummary = {
    month: string; // YYYY-MM
    start_balance: number;
    end_balance: number;
    income: number;
    expenses: number;
    net: number;
};

function monthKey(dateIso: string): string {
    return dateIso.slice(0, 7);
}

function computeMonthly(
    points: ForecastPoint[],
    startingBalance: number,
): MonthlySummary[] {
    if (points.length === 0) return [];

    const byMonth = new Map<string, Omit<MonthlySummary, 'start_balance'>>();
    for (const p of points) {
        const m = monthKey(p.date);
        const income = Number(p.income);
        const expenses = Number(p.expenses);
        const existing = byMonth.get(m);
        if (!existing) {
            byMonth.set(m, {
                month: m,
                end_balance: p.balance,
                income,
                expenses,
                net: income - expenses,
            });
        } else {
            existing.end_balance = p.balance;
            existing.income += income;
            existing.expenses += expenses;
            existing.net += income - expenses;
        }
    }

    const months = Array.from(byMonth.values()).sort((a, b) =>
        a.month.localeCompare(b.month),
    );

    let prevEnd = startingBalance;
    return months.map((m) => {
        const start = prevEnd;
        prevEnd = m.end_balance;
        return {
            month: m.month,
            start_balance: start,
            end_balance: m.end_balance,
            income: m.income,
            expenses: m.expenses,
            net: m.net,
        };
    });
}

function safeUuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const SCENARIO_STORAGE_KEY = 'forecast_scenario_items';

function loadScenarioItems(): ScenarioItem[] {
    try {
        const raw = localStorage.getItem(SCENARIO_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ScenarioItem[]) : [];
    } catch {
        return [];
    }
}

function saveScenarioItems(items: ScenarioItem[]) {
    try {
        localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(items));
    } catch {
        // ignore
    }
}

export function ForecastTab() {
    const today = useMemo(() => formatIsoDate(new Date()), []);

    // Configuration
    const [horizonMonths, setHorizonMonths] = useState('12');
    const [includeBudgets, setIncludeBudgets] = useState(true);
    const [includeSubscriptions, setIncludeSubscriptions] = useState(true);
    const [includeRecurringIncomes, setIncludeRecurringIncomes] =
        useState(true);
    const [includeDiscretionary, setIncludeDiscretionary] = useState(false);
    const [discretionaryLookback, setDiscretionaryLookback] = useState('90');
    const [discretionaryMethod, setDiscretionaryMethod] = useState('dow');
    const [excludeBudgetCategories, setExcludeBudgetCategories] =
        useState(true);

    const [isLoading, setIsLoading] = useState(true);
    const [baselineData, setBaselineData] = useState<ForecastResponse | null>(
        null,
    );
    const [scenarioData, setScenarioData] = useState<ForecastResponse | null>(
        null,
    );

    const [scenarioItems, setScenarioItems] = useState<ScenarioItem[]>(() =>
        loadScenarioItems(),
    );

    // Derived Date Range
    const range = useMemo(() => {
        const from = today;
        const to = formatIsoDate(addMonths(new Date(), Number(horizonMonths)));
        return { from, to };
    }, [today, horizonMonths]);

    const maxDays = useMemo(() => {
        const hm = Number(horizonMonths);
        // generous upper bound: ~31 days/month + buffer
        return Math.min(1825, Math.max(30, hm * 31 + 10));
    }, [horizonMonths]);

    // Independent Target Date (for "Balance on X")
    const [targetDate, setTargetDate] = useState(() => {
        return formatIsoDate(addMonths(new Date(), 12));
    });

    useEffect(() => {
        saveScenarioItems(scenarioItems);
    }, [scenarioItems]);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const baseParams = {
                    from: range.from,
                    to: range.to,
                    include_budgets: includeBudgets,
                    include_subscriptions: includeSubscriptions,
                    include_recurring_incomes: includeRecurringIncomes,
                    include_discretionary: includeDiscretionary,
                    discretionary_lookback_days: Number(discretionaryLookback),
                    discretionary_method: discretionaryMethod,
                    discretionary_exclude_budget_categories:
                        excludeBudgetCategories,
                    max_days: maxDays,
                };

                const baselineReq = api.post(
                    '/statistics/forecast',
                    baseParams,
                );

                const scenarioReq =
                    scenarioItems.length > 0
                        ? api.post('/statistics/forecast', {
                              ...baseParams,
                              scenario_items: scenarioItems,
                          })
                        : null;

                const [baselineRes, scenarioRes] = await Promise.all([
                    baselineReq,
                    scenarioReq ?? Promise.resolve(null),
                ]);

                if (!cancelled) {
                    const b = baselineRes.data as ForecastResponse;
                    const s = (scenarioRes?.data as ForecastResponse) || b;
                    setBaselineData(b);
                    setScenarioData(s);
                }
            } catch (error) {
                console.error('Failed to fetch forecast:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [
        range.from,
        range.to,
        includeBudgets,
        includeSubscriptions,
        includeRecurringIncomes,
        includeDiscretionary,
        discretionaryLookback,
        discretionaryMethod,
        excludeBudgetCategories,
        scenarioItems,
        maxDays,
    ]);

    const currency = scenarioData?.currency ?? baselineData?.currency ?? 'CHF';

    const bPoints = useMemo(() => baselineData?.points ?? [], [baselineData]);
    const sPoints = useMemo(() => scenarioData?.points ?? [], [scenarioData]);

    const targetPoint = useMemo(
        () => findPointAtOrBefore(sPoints, targetDate),
        [sPoints, targetDate],
    );

    const targetPointBaseline = useMemo(
        () => findPointAtOrBefore(bPoints, targetDate),
        [bPoints, targetDate],
    );

    const bStarting = baselineData?.starting_balance ?? 0;
    const sStarting = scenarioData?.starting_balance ?? bStarting;
    const bProjected = baselineData?.projected_balance ?? 0;
    const sProjected = scenarioData?.projected_balance ?? bProjected;

    const netChange = sProjected - sStarting;
    const deltaProjected = sProjected - bProjected;

    const xInterval = useMemo(() => {
        const len = Math.max(bPoints.length, sPoints.length);
        if (len <= 8) return 'preserveStartEnd' as const;
        return Math.max(1, Math.floor(len / 6));
    }, [bPoints.length, sPoints.length]);

    const mergedDaily = useMemo(() => {
        const map = new Map<string, { date: string; baseline: number }>();
        for (const p of bPoints) {
            map.set(p.date, { date: p.date, baseline: p.balance });
        }
        const out: { date: string; baseline: number; scenario: number }[] = [];
        for (const p of sPoints) {
            const base = map.get(p.date)?.baseline ?? p.balance;
            out.push({ date: p.date, baseline: base, scenario: p.balance });
        }
        return out;
    }, [bPoints, sPoints]);

    const monthlyScenario = useMemo(
        () => computeMonthly(sPoints, sStarting),
        [sPoints, sStarting],
    );

    const monthlyBaseline = useMemo(
        () => computeMonthly(bPoints, bStarting),
        [bPoints, bStarting],
    );

    const mergedMonthly = useMemo(() => {
        const baseMap = new Map(
            monthlyBaseline.map((m) => [m.month, m.end_balance] as const),
        );
        return monthlyScenario.map((m) => ({
            month: m.month,
            baseline_end_balance: baseMap.get(m.month) ?? m.end_balance,
            scenario_end_balance: m.end_balance,
            income: m.income,
            expenses: m.expenses,
            net: m.net,
        }));
    }, [monthlyBaseline, monthlyScenario]);

    const addCustom = () => {
        setScenarioItems((prev) => [
            {
                id: safeUuid(),
                name: 'New item',
                kind: 'expense',
                amount: 0,
                frequency: 'monthly',
                day_of_month: 1,
                start_date: range.from,
            },
            ...prev,
        ]);
    };

    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Left Sidebar: Controls */}
            <div className="w-full shrink-0 space-y-6 lg:sticky lg:top-6 lg:w-[340px]">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Simulation Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                        <div className="grid gap-2">
                            <Label>Forecast Horizon</Label>
                            <Select
                                value={horizonMonths}
                                onValueChange={setHorizonMonths}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3 months</SelectItem>
                                    <SelectItem value="6">6 months</SelectItem>
                                    <SelectItem value="12">1 year</SelectItem>
                                    <SelectItem value="24">2 years</SelectItem>
                                    <SelectItem value="60">5 years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>Base Model</Label>
                            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <span className="text-sm">Budgets</span>
                                <Switch
                                    checked={includeBudgets}
                                    onCheckedChange={setIncludeBudgets}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <span className="text-sm">Subscriptions</span>
                                <Switch
                                    checked={includeSubscriptions}
                                    onCheckedChange={setIncludeSubscriptions}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <span className="text-sm">
                                    Recurring Income
                                </span>
                                <Switch
                                    checked={includeRecurringIncomes}
                                    onCheckedChange={setIncludeRecurringIncomes}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <Label>Discretionary Spend</Label>
                                <Switch
                                    checked={includeDiscretionary}
                                    onCheckedChange={setIncludeDiscretionary}
                                />
                            </div>
                            {includeDiscretionary && (
                                <div className="grid gap-3 rounded-lg border bg-muted/30 p-3">
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-muted-foreground">
                                            Lookback
                                        </Label>
                                        <Select
                                            value={discretionaryLookback}
                                            onValueChange={
                                                setDiscretionaryLookback
                                            }
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30">
                                                    Last 30d
                                                </SelectItem>
                                                <SelectItem value="90">
                                                    Last 90d
                                                </SelectItem>
                                                <SelectItem value="180">
                                                    Last 180d
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-muted-foreground">
                                            Pattern
                                        </Label>
                                        <Select
                                            value={discretionaryMethod}
                                            onValueChange={
                                                setDiscretionaryMethod
                                            }
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dow">
                                                    Weekday
                                                </SelectItem>
                                                <SelectItem value="flat">
                                                    Flat Avg
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <Label className="text-xs text-muted-foreground">
                                            Exclude budgeted
                                        </Label>
                                        <Switch
                                            className="scale-75"
                                            checked={excludeBudgetCategories}
                                            onCheckedChange={
                                                setExcludeBudgetCategories
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between py-3">
                        <CardTitle className="text-base">
                            What-if Scenarios
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={addCustom}
                            className="h-8 w-8"
                        >
                            <CirclePlus className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-3 pt-0">
                        {scenarioItems.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                No items added.
                            </div>
                        ) : (
                            scenarioItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="relative grid gap-2 rounded-lg border bg-muted/10 p-3 text-sm transition-all hover:border-primary/20"
                                >
                                    <div className="flex items-center gap-2">
                                        <Input
                                            className="h-7 px-2 font-medium"
                                            value={item.name}
                                            onChange={(e) =>
                                                setScenarioItems((prev) =>
                                                    prev.map((p) =>
                                                        p.id === item.id
                                                            ? {
                                                                  ...p,
                                                                  name: e.target
                                                                      .value,
                                                              }
                                                            : p,
                                                    ),
                                                )
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                setScenarioItems((prev) =>
                                                    prev.filter(
                                                        (p) => p.id !== item.id,
                                                    ),
                                                )
                                            }
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select
                                            value={item.kind}
                                            onValueChange={(v) =>
                                                setScenarioItems((prev) =>
                                                    prev.map((p) =>
                                                        p.id === item.id
                                                            ? {
                                                                  ...p,
                                                                  kind: v as ScenarioItem['kind'],
                                                              }
                                                            : p,
                                                    ),
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-7 px-2 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="expense">
                                                    Expense
                                                </SelectItem>
                                                <SelectItem value="income">
                                                    Income
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            className="h-7 px-2 text-right"
                                            value={item.amount}
                                            onChange={(e) => {
                                                const val = parseFloat(
                                                    e.target.value,
                                                );
                                                setScenarioItems((prev) =>
                                                    prev.map((p) =>
                                                        p.id === item.id
                                                            ? {
                                                                  ...p,
                                                                  amount: isNaN(
                                                                      val,
                                                                  )
                                                                      ? 0
                                                                      : val,
                                                              }
                                                            : p,
                                                    ),
                                                );
                                            }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select
                                            value={item.frequency}
                                            onValueChange={(v) =>
                                                setScenarioItems((prev) =>
                                                    prev.map((p) =>
                                                        p.id === item.id
                                                            ? {
                                                                  ...p,
                                                                  frequency:
                                                                      v as ScenarioItem['frequency'],
                                                              }
                                                            : p,
                                                    ),
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-7 px-2 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">
                                                    Monthly
                                                </SelectItem>
                                                <SelectItem value="weekly">
                                                    Weekly
                                                </SelectItem>
                                                <SelectItem value="yearly">
                                                    Yearly
                                                </SelectItem>
                                                <SelectItem value="once">
                                                    Once
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="date"
                                            className="h-7 px-2 text-xs"
                                            value={
                                                item.start_date ||
                                                item.date ||
                                                range.from
                                            }
                                            onChange={(e) =>
                                                setScenarioItems((prev) =>
                                                    prev.map((p) =>
                                                        p.id === item.id
                                                            ? {
                                                                  ...p,
                                                                  start_date:
                                                                      e.target
                                                                          .value,
                                                                  date: e.target
                                                                      .value,
                                                              }
                                                            : p,
                                                    ),
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Content: Visualization */}
            <div className="min-w-0 flex-1 space-y-6">
                {/* KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Starting Balance"
                        value={formatCurrency(
                            scenarioData?.starting_balance ?? 0,
                            currency,
                        )}
                        icon={Wallet}
                        description="Current"
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="End Balance"
                        value={formatCurrency(sProjected, currency)}
                        icon={TrendingUp}
                        description={
                            scenarioItems.length > 0
                                ? `${deltaProjected >= 0 ? '+' : ''}${formatCurrency(deltaProjected, currency)} vs baseline`
                                : `in ${horizonMonths} months`
                        }
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Net Change"
                        value={formatCurrency(netChange, currency)}
                        icon={netChange >= 0 ? TrendingUp : TrendingDown}
                        description="over period"
                        isLoading={isLoading}
                    />
                    <Card className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Check Date
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {targetPoint
                                    ? formatCurrency(
                                          targetPoint.balance,
                                          currency,
                                      )
                                    : '-'}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <Input
                                    type="date"
                                    className="h-6 w-full px-1 text-xs"
                                    value={targetDate}
                                    onChange={(e) =>
                                        setTargetDate(e.target.value)
                                    }
                                />
                            </div>
                            {scenarioItems.length > 0 &&
                                targetPointBaseline && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        vs{' '}
                                        {formatCurrency(
                                            targetPointBaseline.balance,
                                            currency,
                                        )}{' '}
                                        (base)
                                        {targetPoint && (
                                            <>
                                                {' '}
                                                •{' '}
                                                {targetPoint.balance -
                                                    targetPointBaseline.balance >
                                                0
                                                    ? '+'
                                                    : ''}
                                                {formatCurrency(
                                                    targetPoint.balance -
                                                        targetPointBaseline.balance,
                                                    currency,
                                                )}
                                            </>
                                        )}
                                    </p>
                                )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Chart */}
                <LineChartCard
                    title="Projected Balance"
                    description="Daily balance simulation over time"
                    data={scenarioItems.length > 0 ? mergedDaily : sPoints}
                    dataKeys={
                        scenarioItems.length > 0
                            ? [
                                  {
                                      key: 'baseline',
                                      name: 'Baseline',
                                      color: '#94a3b8', // Slate 400
                                  },
                                  {
                                      key: 'scenario',
                                      name: 'Scenario',
                                      color: '#10b981', // Emerald 500
                                  },
                              ]
                            : [
                                  {
                                      key: 'balance',
                                      name: 'Balance',
                                      color: '#10b981',
                                  },
                              ]
                    }
                    xAxisKey="date"
                    xAxisTickFormatter={(val) =>
                        typeof val === 'string' ? val.slice(5) : String(val)
                    }
                    valueFormatter={(val) =>
                        formatCurrency(Number(val || 0), currency)
                    }
                    xAxisInterval={xInterval}
                    height={400}
                    isLoading={isLoading}
                />

                {/* Secondary Charts / Table */}
                <div className="grid gap-6">
                    <BarChartCard
                        title="Monthly Cash Flow"
                        description="Expected income vs expenses"
                        data={mergedMonthly}
                        dataKeys={[
                            {
                                key: 'income',
                                name: 'Income',
                                color: '#10b981',
                            },
                            {
                                key: 'expenses',
                                name: 'Expenses',
                                color: '#ef4444',
                            },
                        ]}
                        xAxisKey="month"
                        valueFormatter={(val) =>
                            formatCurrency(Number(val || 0), currency)
                        }
                        height={300}
                        isLoading={isLoading}
                    />

                    {mergedMonthly.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Month</TableHead>
                                                <TableHead className="text-right">
                                                    Income
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Expenses
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Net
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    End Balance
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mergedMonthly.map((m) => (
                                                <TableRow key={m.month}>
                                                    <TableCell className="font-medium">
                                                        {m.month}
                                                    </TableCell>
                                                    <TableCell className="text-right text-emerald-600">
                                                        {formatCurrency(
                                                            m.income,
                                                            currency,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600">
                                                        {formatCurrency(
                                                            m.expenses,
                                                            currency,
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        className={`text-right font-medium ${m.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                                                    >
                                                        {formatCurrency(
                                                            m.net,
                                                            currency,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(
                                                            m.scenario_end_balance,
                                                            currency,
                                                        )}
                                                        {scenarioItems.length >
                                                            0 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {m.scenario_end_balance -
                                                                    m.baseline_end_balance >
                                                                0
                                                                    ? '+'
                                                                    : ''}
                                                                {formatCurrency(
                                                                    m.scenario_end_balance -
                                                                        m.baseline_end_balance,
                                                                    currency,
                                                                )}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
