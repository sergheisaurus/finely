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

export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type IncomeFrequency = 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'yearly';

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
