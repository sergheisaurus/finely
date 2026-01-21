export interface BankAccount {
    id: number;
    name: string;
    type: 'checking' | 'savings';
    balance: number;
    currency: string;
    account_number?: string;
    bank_name?: string;
    color: string;
    icon?: string;
    is_default: boolean;
    cards_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Card {
    id: number;
    bank_account_id?: number;
    type: 'debit' | 'credit';
    card_holder_name: string;
    card_number: string;
    card_network: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
    expiry_month: number;
    expiry_year: number;
    expiry_date: string;
    is_expired: boolean;
    credit_limit?: number;
    current_balance: number;
    available_credit?: number;
    payment_due_day?: number;
    billing_cycle_day?: number;
    color: string;
    currency: string;
    is_default: boolean;
    bank_account?: BankAccount;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    parent_id?: number;
    name: string;
    icon?: string;
    color: string;
    type: 'income' | 'expense';
    is_parent: boolean;
    parent?: Category;
    children?: Category[];
    transactions_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Merchant {
    id: number;
    name: string;
    type: 'company' | 'person';
    image_path?: string;
    transactions_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: number;
    type: 'income' | 'expense' | 'transfer' | 'card_payment';
    amount: number;
    currency: string;
    title: string;
    description?: string;
    transaction_date: string;
    from_account_id?: number;
    from_card_id?: number;
    to_account_id?: number;
    to_card_id?: number;
    category_id?: number;
    merchant_id?: number;
    from_account?: BankAccount;
    from_card?: Card;
    to_account?: BankAccount;
    to_card?: Card;
    category?: Category;
    merchant?: Merchant;
    attachments?: TransactionAttachment[];
    attachments_count?: number;
    transactionable_type?: string;
    transactionable_id?: number;
    created_at: string;
    updated_at: string;
}

export interface TransactionAttachment {
    id: number;
    transaction_id: number;
    file_path: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    formatted_size: string;
    is_image: boolean;
    is_pdf: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserPreference {
    id: number;
    default_account_id?: number;
    default_card_id?: number;
    currency: string;
    default_account?: BankAccount;
    default_card?: Card;
    created_at: string;
    updated_at: string;
}

export type BillingCycle =
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly';
export type IncomeFrequency =
    | 'weekly'
    | 'bi_weekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly';

export interface Subscription {
    id: number;
    merchant_id?: number;
    category_id?: number;
    payment_method_type?: 'bank_account' | 'card';
    payment_method_id?: number;
    name: string;
    description?: string;
    amount: number;
    currency: string;
    billing_cycle: BillingCycle;
    billing_day?: number;
    billing_month?: number;
    start_date: string;
    end_date?: string;
    last_billed_date?: string;
    next_billing_date?: string;
    is_active: boolean;
    auto_create_transaction: boolean;
    reminder_days_before: number;
    color?: string;
    icon?: string;

    // Computed fields
    is_overdue: boolean;
    is_due_soon: boolean;
    monthly_equivalent: number;
    yearly_total: number;

    // Relationships
    merchant?: Merchant;
    category?: Category;
    payment_method?: BankAccount | Card;
    transactions_count?: number;

    created_at: string;
    updated_at: string;
}

export interface RecurringIncome {
    id: number;
    category_id?: number;
    to_account_id?: number;
    name: string;
    description?: string;
    source?: string;
    amount: number;
    currency: string;
    frequency: IncomeFrequency;
    payment_day?: number;
    payment_month?: number;
    start_date: string;
    end_date?: string;
    last_received_date?: string;
    next_expected_date?: string;
    is_active: boolean;
    auto_create_transaction: boolean;
    reminder_days_before: number;
    color?: string;
    icon?: string;

    // Computed fields
    is_overdue: boolean;
    is_expected_soon: boolean;
    monthly_equivalent: number;
    yearly_total: number;

    // Relationships
    category?: Category;
    to_account?: BankAccount;
    transactions_count?: number;

    created_at: string;
    updated_at: string;
}

export interface SubscriptionStats {
    active_count: number;
    monthly_total: number;
    yearly_total: number;
    upcoming_this_week: number;
    overdue_count: number;
}

export interface RecurringIncomeStats {
    active_count: number;
    monthly_total: number;
    yearly_total: number;
    expected_this_week: number;
    overdue_count: number;
}

// Invoice Types
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface Invoice {
    id: number;
    merchant_id?: number;
    category_id?: number;
    invoice_number?: string;
    reference?: string;
    amount: number;
    currency: string;
    issue_date: string;
    due_date?: string;
    paid_date?: string;
    status: InvoiceStatus;

    // Recurring settings
    is_recurring: boolean;
    frequency?: InvoiceFrequency;
    billing_day?: number;
    next_due_date?: string;
    times_paid: number;

    // QR data
    qr_data?: SwissQrData;
    qr_raw_text?: string;
    creditor_name?: string;
    creditor_iban?: string;
    payment_reference?: string;

    // Notes and visual
    notes?: string;
    color?: string;
    icon?: string;

    // Computed fields
    is_overdue: boolean;
    is_pending: boolean;
    is_paid: boolean;
    days_until_due?: number;
    days_overdue?: number;

    // Relationships
    merchant?: Merchant;
    category?: Category;
    items?: InvoiceItem[];
    attachments?: InvoiceAttachment[];
    items_count?: number;
    attachments_count?: number;
    transactions_count?: number;

    created_at: string;
    updated_at: string;
}

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface InvoiceAttachment {
    id: number;
    invoice_id: number;
    file_path: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    formatted_size: string;
    is_primary: boolean;
    url: string;
    is_image: boolean;
    is_pdf: boolean;
    created_at: string;
    updated_at: string;
}

export interface SwissQrData {
    type: string;
    version: string;
    iban: string;
    creditor_name: string;
    creditor_address?: string;
    amount?: number;
    currency: string;
    reference_type: 'QRR' | 'SCOR' | 'NON';
    reference?: string;
    message?: string;
}

export interface InvoiceStats {
    total_count: number;
    pending_count: number;
    paid_count: number;
    overdue_count: number;
    pending_total: number;
    overdue_total: number;
    recurring_count: number;
    upcoming_this_week: number;
}

// Budget Types
export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';
export type BudgetHealth = 'healthy' | 'warning' | 'danger' | 'exceeded';

export interface Budget {
    id: number;
    category_id: number | null;
    name: string;
    description: string | null;
    amount: number;
    currency: string;
    period: BudgetPeriod;
    start_date: string;
    end_date: string | null;
    current_period_start: string;
    current_period_end: string;
    current_period_spent: number;
    rollover_unused: boolean;
    rollover_amount: number;
    alert_threshold: number;
    alert_sent: boolean;
    is_active: boolean;
    color: string | null;
    icon: string | null;

    // Computed fields
    effective_budget: number;
    remaining_amount: number;
    spent_percentage: number;
    is_over_budget: boolean;
    is_near_limit: boolean;
    budget_health: BudgetHealth;
    health_color: string;
    daily_avg_spent: number;
    daily_avg_remaining: number;
    days_left_in_period: number;
    projected_spending: number;
    will_exceed: boolean;

    // Relationships
    category?: Category;

    created_at: string;
    updated_at: string;
}

export interface BudgetStats {
    active_count: number;
    total_budgeted: number;
    total_spent: number;
    total_remaining: number;
    over_budget_count: number;
    warning_count: number;
    overall_percentage: number;
}

export interface BudgetBreakdown {
    id: number | null;
    name: string;
    icon?: string | null;
    color?: string | null;
    image_url?: string | null;
    amount: number;
    count: number;
}

export interface BudgetHealthDetails {
    status: BudgetHealth;
    color: string;
    percentage: number;
    spent: number;
    remaining: number;
    effective_budget: number;
    daily_avg_spent: number;
    daily_avg_remaining: number;
    projected_spending: number;
    will_exceed: boolean;
    days_left: number;
}

export interface BudgetComparison {
    has_previous: boolean;
    previous_period_start?: string;
    previous_period_end?: string;
    previous_spending: number;
    current_spending: number;
    difference: number;
    percentage_change: number;
    trend: 'up' | 'down' | 'flat';
}

export interface BudgetImpact {
    current_spent: number;
    transaction_amount: number;
    projected_spent: number;
    projected_remaining: number;
    projected_percentage: number;
    effective_budget: number;
    currently_over_budget: boolean;
    will_be_over_budget: boolean;
    exceeds_by: number;
}
