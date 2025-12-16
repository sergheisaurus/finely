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
    last_four_digits: string;
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
