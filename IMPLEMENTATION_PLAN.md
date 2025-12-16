# Finance Management App - Implementation Plan

## Project Overview
Building a comprehensive finance management application with Laravel API backend and React/Inertia frontend. Focus on MVP: accounts, cards, transactions, categories, and journal tracking.

## User Requirements Summary
- ✅ Single currency (EUR/USD/etc.)
- ✅ Multiple bank accounts with debit/credit cards
- ✅ Credit cards: visual card display, monthly limit, payment due dates, manual payment confirmation
- ✅ Central transaction journal tracking everything
- ✅ Categories (main + sub-categories) with icons
- ✅ Merchants/People (companies, stores, individuals) with images (placeholder for now)
- ✅ Default payment method selection
- ✅ File uploads (placeholder for now, CDN later)
- ✅ Fully API-driven (all interactions via API)
- ✅ Everything editable after creation
- ✅ Modern, smooth, mobile-friendly UI with themes

## Database Schema Design

### Core Tables

#### 1. `bank_accounts`
```sql
id, user_id, name, type (checking/savings), balance (decimal 10,2),
currency (VARCHAR 3), account_number (nullable), bank_name,
color (hex), icon, is_default (boolean), created_at, updated_at, soft_deletes
```

#### 2. `cards`
```sql
id, user_id, bank_account_id (nullable for credit),
type (debit/credit), card_holder_name, last_four_digits,
card_network (visa/mastercard/amex), expiry_month, expiry_year,
[Credit Card Fields]: credit_limit (nullable), current_balance (nullable),
payment_due_day (1-31, nullable), billing_cycle_day (nullable),
color (hex), is_default (boolean),
created_at, updated_at, soft_deletes
```

#### 3. `categories`
```sql
id, user_id, parent_id (nullable for sub-categories),
name, icon, color, type (income/expense),
created_at, updated_at, soft_deletes
```

#### 4. `merchants`
```sql
id, user_id, name, type (company/person),
image_url (placeholder for now), created_at, updated_at, soft_deletes
```

#### 5. `transactions` (Central Journal)
```sql
id, user_id, transaction_type (income/expense/transfer/payment),
amount (decimal 10,2), currency,
title, description (text),
transaction_date (date),
from_account_id (nullable), from_card_id (nullable),
to_account_id (nullable), to_card_id (nullable),
category_id (sub-category), merchant_id (nullable),
transactionable_type (polymorphic - subscription/invoice/etc),
transactionable_id (polymorphic),
created_at, updated_at, soft_deletes
```

#### 6. `transaction_attachments`
```sql
id, transaction_id, file_path (placeholder for now),
file_name, file_type, file_size,
created_at, updated_at
```

#### 7. `user_preferences`
```sql
id, user_id, default_account_id (nullable), default_card_id (nullable),
currency (default), theme, created_at, updated_at
```

### Future Tables (Post-MVP)
- `subscriptions` - Track subscriptions with payment schedules
- `recurring_incomes` - Track salary and recurring income
- `invoices` - Track invoices with QR codes
- `budgets` - Budget limits per category

## API Structure

### RESTful API Endpoints

#### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/user
```

#### Bank Accounts
```
GET    /api/accounts              - List all accounts
POST   /api/accounts              - Create account
GET    /api/accounts/{id}         - Get single account
PUT    /api/accounts/{id}         - Update account
DELETE /api/accounts/{id}         - Delete account
POST   /api/accounts/{id}/set-default - Set as default
GET    /api/accounts/{id}/transactions - Get account transactions
```

#### Cards
```
GET    /api/cards                 - List all cards
POST   /api/cards                 - Create card
GET    /api/cards/{id}            - Get single card
PUT    /api/cards/{id}            - Update card
DELETE /api/cards/{id}            - Delete card
POST   /api/cards/{id}/set-default - Set as default
POST   /api/cards/{id}/pay-balance - Pay off credit card (with confirmation)
GET    /api/cards/{id}/transactions - Get card transactions
```

#### Categories
```
GET    /api/categories            - List all categories (tree structure)
POST   /api/categories            - Create category
GET    /api/categories/{id}       - Get single category
PUT    /api/categories/{id}       - Update category
DELETE /api/categories/{id}       - Delete category
GET    /api/categories/{id}/transactions - Get category transactions
```

#### Merchants
```
GET    /api/merchants             - List all merchants
POST   /api/merchants             - Create merchant
GET    /api/merchants/{id}        - Get single merchant
PUT    /api/merchants/{id}        - Update merchant
DELETE /api/merchants/{id}        - Delete merchant
GET    /api/merchants/{id}/transactions - Get merchant transactions
```

#### Transactions
```
GET    /api/transactions          - List all transactions (journal)
POST   /api/transactions          - Create transaction
GET    /api/transactions/{id}     - Get single transaction
PUT    /api/transactions/{id}     - Update transaction
DELETE /api/transactions/{id}     - Delete transaction
POST   /api/transactions/{id}/attachments - Upload attachment
DELETE /api/transactions/{id}/attachments/{attachmentId} - Delete attachment
```

#### Transfers
```
POST   /api/transfers             - Transfer between accounts
```

#### User Preferences
```
GET    /api/preferences           - Get user preferences
PUT    /api/preferences           - Update preferences
```

## Backend Architecture

### Directory Structure
```
app/
├── Models/
│   ├── BankAccount.php
│   ├── Card.php
│   ├── Category.php
│   ├── Merchant.php
│   ├── Transaction.php
│   ├── TransactionAttachment.php
│   └── UserPreference.php
│
├── Http/
│   ├── Controllers/Api/
│   │   ├── BankAccountController.php
│   │   ├── CardController.php
│   │   ├── CategoryController.php
│   │   ├── MerchantController.php
│   │   ├── TransactionController.php
│   │   ├── TransferController.php
│   │   └── PreferenceController.php
│   │
│   ├── Requests/
│   │   ├── BankAccountRequest.php
│   │   ├── CardRequest.php
│   │   ├── CategoryRequest.php
│   │   ├── MerchantRequest.php
│   │   ├── TransactionRequest.php
│   │   └── TransferRequest.php
│   │
│   └── Resources/
│       ├── BankAccountResource.php
│       ├── CardResource.php
│       ├── CategoryResource.php
│       ├── MerchantResource.php
│       └── TransactionResource.php
│
└── Services/
    ├── TransactionService.php  - Complex transaction logic
    ├── TransferService.php     - Handle transfers with journal entries
    └── CardPaymentService.php  - Handle credit card payments
```

### Key Model Relationships

**User**
```php
hasMany(BankAccount, Card, Category, Merchant, Transaction)
hasOne(UserPreference)
```

**BankAccount**
```php
belongsTo(User)
hasMany(Card) - debit cards
hasMany(Transaction) - via from_account_id, to_account_id
```

**Card**
```php
belongsTo(User)
belongsTo(BankAccount) - nullable for credit cards
hasMany(Transaction) - via from_card_id, to_card_id
```

**Category**
```php
belongsTo(User)
belongsTo(Category as parent) - self-referential
hasMany(Category as children)
hasMany(Transaction)
```

**Merchant**
```php
belongsTo(User)
hasMany(Transaction)
```

**Transaction**
```php
belongsTo(User)
belongsTo(BankAccount as fromAccount) - nullable
belongsTo(BankAccount as toAccount) - nullable
belongsTo(Card as fromCard) - nullable
belongsTo(Card as toCard) - nullable
belongsTo(Category)
belongsTo(Merchant) - nullable
morphTo(Transactionable) - for subscriptions/invoices later
hasMany(TransactionAttachment)
```

## Frontend Architecture

### Page Structure
```
resources/js/pages/
├── dashboard.tsx              - Overview, quick stats, recent transactions
├── journal.tsx                - Main transaction journal list
├── transaction.tsx            - Single transaction detail view
│
├── accounts/
│   ├── index.tsx             - List all bank accounts
│   ├── create.tsx            - Create new account
│   ├── [id]/edit.tsx         - Edit account
│   └── [id]/view.tsx         - Account detail with transactions
│
├── cards/
│   ├── index.tsx             - List all cards (visual grid)
│   ├── create.tsx            - Create new card
│   ├── [id]/edit.tsx         - Edit card
│   └── [id]/view.tsx         - Card detail with transactions
│
├── categories/
│   ├── index.tsx             - Manage categories (tree view)
│   └── manage.tsx            - Create/edit categories
│
├── merchants/
│   ├── index.tsx             - List all merchants
│   ├── create.tsx            - Create merchant
│   └── [id]/view.tsx         - Merchant detail with transactions
│
└── settings/
    └── preferences.tsx        - User preferences, defaults, currency
```

### Component Structure
```
resources/js/components/
├── finance/
│   ├── account-card.tsx       - Bank account card display
│   ├── credit-card-visual.tsx - Visual credit/debit card component
│   ├── transaction-list.tsx   - Reusable transaction list
│   ├── transaction-item.tsx   - Single transaction row
│   ├── category-select.tsx    - Hierarchical category selector
│   ├── merchant-select.tsx    - Merchant selector with search
│   ├── payment-method-select.tsx - Select account/card
│   ├── amount-input.tsx       - Currency formatted input
│   ├── date-picker.tsx        - Date selector
│   └── file-upload-placeholder.tsx - Placeholder for file uploads
│
├── modals/
│   ├── transaction-modal.tsx  - Create/edit transaction
│   ├── transfer-modal.tsx     - Transfer between accounts
│   ├── pay-card-modal.tsx     - Pay credit card balance
│   ├── account-modal.tsx      - Create/edit account
│   └── card-modal.tsx         - Create/edit card
│
└── ui/
    └── [existing shadcn components]
```

### Key Frontend Features

**1. Visual Card Display**
- CSS-based credit card design
- Shows card network logo, last 4 digits, expiry
- Color customization
- Flip animation for details

**2. Transaction Creation Flow**
```
1. Select type (income/expense/transfer)
2. Enter amount
3. Select payment method (account/card) - remembers default
4. Select category (hierarchical dropdown)
5. Select merchant (searchable, create new inline)
6. Add title, description
7. Select date
8. Upload files (placeholder)
9. Submit → API creates transaction
```

**3. Journal View**
- Infinite scroll / pagination
- Filter by: date range, type, category, merchant, account/card
- Search by title/description
- Sort by: date, amount
- Click transaction → opens detail modal or page
- Click merchant → shows all merchant transactions

**4. Credit Card Payment Flow**
```
1. Card shows "Payment Due" badge if past due date
2. Click "Pay Balance" button
3. Modal shows:
   - Current balance
   - Linked bank account
   - Editable payment amount
   - Confirm button
4. On confirm:
   - API creates transaction (type: payment)
   - Deducts from bank account
   - Reduces credit card balance
   - Records in journal
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Backend:**
- [ ] Add HasApiTokens trait to User model
- [ ] Create migrations for all core tables
- [ ] Create all models with relationships
- [ ] Set up factories and seeders

**Frontend:**
- [ ] Set up routing structure
- [ ] Create basic layout with navigation
- [ ] Set up API client utilities
- [ ] Create color scheme and theme

### Phase 2: Bank Accounts & Cards (Week 2-3)
**Backend:**
- [ ] BankAccountController with CRUD + set-default
- [ ] CardController with CRUD + set-default
- [ ] API Resources for accounts and cards
- [ ] Form Request validation

**Frontend:**
- [ ] Account list and card list pages
- [ ] Visual card component (CSS card design)
- [ ] Account/card creation forms
- [ ] Account/card detail views

### Phase 3: Categories & Merchants (Week 3-4)
**Backend:**
- [ ] CategoryController with tree structure support
- [ ] MerchantController with CRUD
- [ ] API Resources

**Frontend:**
- [ ] Category management page (tree view)
- [ ] Category selector component (hierarchical)
- [ ] Merchant management page
- [ ] Merchant selector component (searchable)

### Phase 4: Transactions & Journal (Week 4-6)
**Backend:**
- [ ] TransactionController with CRUD
- [ ] TransactionService for complex logic
- [ ] TransferService for account-to-account transfers
- [ ] Attachment handling (placeholder)
- [ ] Transaction filtering and search

**Frontend:**
- [ ] Transaction creation modal/form
- [ ] Journal list page with filters
- [ ] Transaction detail view
- [ ] Transfer modal
- [ ] Amount input with currency formatting
- [ ] File upload placeholder components

### Phase 5: Credit Card Payments (Week 6-7)
**Backend:**
- [ ] CardPaymentService
- [ ] Pay balance endpoint with validation
- [ ] Update card balance logic
- [ ] Create payment transaction record

**Frontend:**
- [ ] Payment due indicators on cards
- [ ] Pay balance modal with confirmation
- [ ] Payment history on card detail page

### Phase 6: User Preferences & Defaults (Week 7)
**Backend:**
- [ ] UserPreference model and migration
- [ ] PreferenceController
- [ ] Apply defaults in transaction creation

**Frontend:**
- [ ] Preferences settings page
- [ ] Remember default payment method in forms
- [ ] Theme switcher integration

### Phase 7: Polish & Mobile (Week 8)
**Frontend:**
- [ ] Responsive design for all pages
- [ ] Animations and transitions
- [ ] Loading states and skeletons
- [ ] Error handling and validation feedback
- [ ] Mobile navigation optimization
- [ ] Touch-friendly interactions

### Phase 8: Testing & Refinement (Week 9)
- [ ] API endpoint tests (Pest)
- [ ] Service layer tests
- [ ] Frontend component testing
- [ ] Integration testing
- [ ] Bug fixes and optimization

## Technical Decisions

### API-First Approach
- All data mutations go through Laravel API endpoints
- Use Sanctum for API authentication
- API resources for consistent JSON responses
- Proper HTTP status codes and error messages

### State Management
- React hooks for component state
- Custom hooks for complex logic (e.g., useTransactions, useBankAccounts)
- Inertia shared props for user/preferences
- React Query or SWR for API data caching (optional, evaluate in Phase 4)

### Form Handling
- Controlled forms with react-hook-form (if needed for complex validation)
- Or continue with Inertia Form component pattern
- Server-side validation via Form Requests
- Real-time validation feedback

### Database Considerations
- Soft deletes on all financial records (audit trail)
- Decimal(10,2) for monetary values
- Index foreign keys and frequently queried columns
- Consider adding balance audit logs later

### Security
- API rate limiting on all endpoints
- Validate user ownership on all queries (user_id checks)
- CSRF protection via Sanctum
- Sanitize user inputs
- Credit card details: only store last 4 digits (no full numbers)

### UI/UX Principles
- Consistent color coding (accounts, cards, categories)
- Icon-based navigation
- Smooth transitions (Headless UI transitions)
- Optimistic updates where appropriate
- Clear error messages
- Confirmation for destructive actions

## Future Enhancements (Post-MVP)
- Subscriptions tracking with reminders
- Recurring income management
- Invoice management with QR code support
- Budget limits and alerts
- Financial reports and analytics
- Export to CSV/PDF
- Bank statement import
- Multi-user/family accounts
- Receipt OCR (with CDN and AI)
- Spending insights and trends

## Development Commands Reference
```bash
# Start development servers
composer dev

# Run migrations
php artisan migrate

# Create migration
php artisan make:migration create_table_name

# Create model with migration, controller, factory
php artisan make:model ModelName -mcf

# Create API controller
php artisan make:controller Api/ControllerName --api

# Create form request
php artisan make:request RequestName

# Create resource
php artisan make:resource ResourceName

# Run tests
composer test

# Code formatting
./vendor/bin/pint
npm run format

# Type checking
npm run types
```

## Notes
- Use existing shadcn/ui components where possible
- Follow existing patterns from settings pages
- Leverage Wayfinder for type-safe routing
- File uploads: implement placeholder UI now, swap with CDN later
- All timestamps in user's timezone (handle in frontend)
- Consider adding activity log for audit trail later
