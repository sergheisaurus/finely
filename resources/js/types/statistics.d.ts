export type Trend = {
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
};

export type FinancialSnapshot = {
    total_balance: number;
    total_income: number;
    total_expenses: number;
    net_savings: number;
    savings_rate: number;
    income_trend: Trend;
    expenses_trend: Trend;
};

export type CashFlowItem = {
    period: string;
    income: number;
    expenses: number;
    [key: string]: unknown;
};

export type TopCategory = {
    id: number | null;
    name: string;
    total: number;
    color?: string;
    icon?: string;
    transaction_count: number;
    percentage: number;
    [key: string]: unknown;
};

export type TopMerchant = {
    id: number | null;
    name: string;
    type: 'company' | 'person';
    total: number;
    transaction_count: number;
    average_transaction: number;
    [key: string]: unknown;
};

export type AccountStats = {
    id: number;
    name: string;
    balance: number;
    income: number;
    expenses: number;
    net: number;
};

export type StatisticsData = {
    snapshot: FinancialSnapshot;
    cash_flow: CashFlowItem[];
    top_categories: TopCategory[];
    top_merchants: TopMerchant[];
};

export type ForecastPoint = {
    date: string; // YYYY-MM-DD
    balance: number;
    income: number;
    expenses: number;
    subscription_expenses: number;
    budget_expenses: number;
    discretionary_expenses: number;
};

export type ForecastResponse = {
    from: string;
    to: string;
    currency: string;
    starting_balance: number;
    projected_balance: number;
    points: ForecastPoint[];
    totals: {
        income: number;
        expenses: number;
        subscription_expenses: number;
        budget_expenses: number;
        discretionary_expenses: number;
        net: number;
    };
};

export type ScenarioItem = {
    id: string;
    name: string;
    kind: 'income' | 'expense';
    amount: number;
    frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
    date?: string;
    start_date?: string;
    end_date?: string;
    day_of_month?: number;
    day_of_week?: number;
    month_of_year?: number;
};
