# Finely - Post-MVP Implementation Plan

## Current Status
✅ **MVP Complete** - All core features implemented, tested, and polished:
- Bank accounts and cards management
- Transaction journal with full CRUD
- Categories and merchants with icons
- Credit card payments
- User preferences and defaults
- Responsive design with animations
- Finely branding complete

## Post-MVP Feature Roadmap

### Phase 1: Subscriptions & Recurring Income (Priority: High)
**Timeline: 2-3 weeks**

#### 1.1 Subscriptions Tracking
**Backend:**
- Create `subscriptions` table:
  ```sql
  id, user_id, merchant_id, category_id, payment_method_type (account/card),
  payment_method_id, name, amount, currency, billing_cycle (daily/weekly/monthly/yearly),
  billing_day (1-31), start_date, end_date (nullable), is_active, last_billed_date,
  next_billing_date, reminder_days_before (default 3), created_at, updated_at, soft_deletes
  ```
- Create `Subscription` model with polymorphic payment method relationship
- Create `SubscriptionController` API endpoints:
  - `GET /api/subscriptions` - List all subscriptions
  - `POST /api/subscriptions` - Create subscription
  - `GET /api/subscriptions/{id}` - Get single subscription
  - `PUT /api/subscriptions/{id}` - Update subscription
  - `DELETE /api/subscriptions/{id}` - Cancel subscription
  - `POST /api/subscriptions/{id}/toggle` - Activate/deactivate
  - `POST /api/subscriptions/{id}/process` - Manually trigger payment
- Create `SubscriptionService`:
  - Auto-generate transactions based on billing cycle
  - Calculate next billing dates
  - Send reminders (email/notification)
  - Handle failed payment retries
- Create artisan command: `php artisan subscriptions:process` (run daily via scheduler)
- Create artisan command: `php artisan subscriptions:remind` (run daily)

**Frontend:**
- `pages/subscriptions/index.tsx` - List all subscriptions with status badges
- `pages/subscriptions/create.tsx` - Create subscription form
- `pages/subscriptions/[id]/edit.tsx` - Edit subscription
- `pages/subscriptions/[id]/view.tsx` - Subscription detail with payment history
- `components/finance/subscription-card.tsx` - Visual subscription card
- `components/finance/billing-cycle-selector.tsx` - Select billing frequency
- Add subscriptions to dashboard overview
- Add subscription badge to transaction items
- Add "Convert to Subscription" action on recurring transactions

**Features:**
- Visual calendar showing upcoming subscription payments
- Spending breakdown by subscription
- Inactive/paused subscription management
- Duplicate/clone subscription functionality
- Export subscription list

#### 1.2 Recurring Income
**Backend:**
- Create `recurring_incomes` table:
  ```sql
  id, user_id, category_id, to_account_id, name, amount, currency,
  frequency (weekly/bi-weekly/monthly/quarterly/yearly), payment_day,
  start_date, end_date (nullable), is_active, last_received_date,
  next_expected_date, created_at, updated_at, soft_deletes
  ```
- Create `RecurringIncome` model
- Create `RecurringIncomeController` with CRUD endpoints
- Create `RecurringIncomeService` for auto-transaction generation
- Add to scheduler: `php artisan recurring-income:process`

**Frontend:**
- `pages/income/index.tsx` - Manage recurring income
- `pages/income/create.tsx` - Create recurring income
- `pages/income/[id]/edit.tsx` - Edit recurring income
- Add income forecast to dashboard
- Add "Expected Income" section to dashboard

**Features:**
- Income calendar view
- Mark as received/missed
- Track payment delays
- Annual income projections

---

### Phase 2: Budgets & Financial Reports (Priority: High)
**Timeline: 2-3 weeks**

#### 2.1 Budget Management
**Backend:**
- Create `budgets` table:
  ```sql
  id, user_id, category_id (nullable for overall budget), name, amount,
  currency, period (monthly/quarterly/yearly), start_date, end_date (nullable),
  rollover_unused (boolean), alert_threshold (percentage, default 80),
  is_active, created_at, updated_at, soft_deletes
  ```
- Create `Budget` model with category relationship
- Create `BudgetController` API endpoints
- Create `BudgetService`:
  - Calculate spending vs budget
  - Track budget health (under/over/at-risk)
  - Generate alerts when threshold reached
  - Handle period rollovers

**Frontend:**
- `pages/budgets/index.tsx` - Budget overview with progress bars
- `pages/budgets/create.tsx` - Create budget
- `pages/budgets/[id]/edit.tsx` - Edit budget
- `pages/budgets/[id]/view.tsx` - Budget detail with spending breakdown
- `components/finance/budget-progress.tsx` - Visual budget progress
- `components/finance/budget-alert.tsx` - Over-budget warnings
- Add budget widgets to dashboard
- Add budget indicators on transaction creation

**Features:**
- Category budget vs spending charts
- Budget health score
- Monthly budget comparison
- Budget alerts and notifications
- Forecast budget needs based on spending patterns

#### 2.2 Financial Reports & Analytics
**Backend:**
- Create `ReportController`:
  - `GET /api/reports/income-vs-expense` - Monthly/yearly comparison
  - `GET /api/reports/category-breakdown` - Spending by category
  - `GET /api/reports/merchant-spending` - Top merchants
  - `GET /api/reports/account-balance-history` - Balance over time
  - `GET /api/reports/cash-flow` - Income and expense trends
  - `GET /api/reports/net-worth` - Total assets calculation
- Create `ReportService` with complex aggregation queries
- Add caching for expensive report queries

**Frontend:**
- `pages/reports/index.tsx` - Reports dashboard
- `pages/reports/income-expense.tsx` - Income vs expense charts
- `pages/reports/categories.tsx` - Category breakdown (pie/donut charts)
- `pages/reports/trends.tsx` - Spending trends over time
- `pages/reports/net-worth.tsx` - Net worth tracker
- `components/charts/` - Chart components using Recharts or Chart.js
- Date range selector for all reports
- Export report data to CSV/PDF

**Features:**
- Monthly spending trends
- Category spending comparison
- Income sources breakdown
- Top merchants by spending
- Account balance history
- Net worth tracking over time
- Savings rate calculation
- Custom date range reports

---

### Phase 3: Data Import/Export (Priority: Medium)
**Timeline: 2 weeks**

#### 3.1 Export Functionality
**Backend:**
- Create `ExportController`:
  - `GET /api/exports/transactions` - Export transactions to CSV
  - `GET /api/exports/budget-report` - Export budget report to PDF
  - `GET /api/exports/financial-summary` - Export summary to PDF
- Create `ExportService`:
  - Generate CSV from transaction data
  - Generate PDF reports using Laravel Snappy or Dompdf
  - Handle large dataset exports with queued jobs
- Add export queue jobs for large datasets

**Frontend:**
- Add "Export" buttons to journal, reports, budgets
- `components/modals/export-modal.tsx` - Export options modal
- Date range and filter selection for exports
- Download progress indicators
- Export history page (optional)

**Features:**
- Export transactions to CSV/Excel
- Export reports to PDF
- Customizable export fields
- Bulk export all data (backup)

#### 3.2 Bank Statement Import
**Backend:**
- Create `ImportController`:
  - `POST /api/imports/transactions` - Upload CSV/OFX file
  - `GET /api/imports/{id}/preview` - Preview imported data
  - `POST /api/imports/{id}/confirm` - Confirm and process import
- Create `ImportService`:
  - Parse CSV/OFX/QFX files
  - Map columns to transaction fields
  - Detect duplicates
  - Auto-match merchants and categories (ML/fuzzy matching)
- Create `ImportJob` for background processing

**Frontend:**
- `pages/import/index.tsx` - Import page with file upload
- `pages/import/[id]/preview.tsx` - Preview and map columns
- `components/import/column-mapper.tsx` - Map CSV columns to fields
- `components/import/duplicate-detector.tsx` - Show potential duplicates
- Import history and status tracking

**Features:**
- CSV import with column mapping
- OFX/QFX bank statement import
- Duplicate detection and merging
- Auto-categorization based on merchant/description
- Import rules and templates (save mapping)

---

### Phase 4: Invoices & Advanced Features (Priority: Medium)
**Timeline: 2-3 weeks**

#### 4.1 Invoice Management
**Backend:**
- Create `invoices` table:
  ```sql
  id, user_id, merchant_id, invoice_number, amount, currency,
  issue_date, due_date, status (draft/sent/paid/overdue/cancelled),
  qr_code_data (nullable), pdf_path (nullable), notes,
  created_at, updated_at, soft_deletes
  ```
- Create `invoice_items` table for line items
- Create `Invoice` and `InvoiceItem` models
- Create `InvoiceController` with CRUD endpoints
- Create `InvoiceService`:
  - Generate invoice numbers
  - Generate QR codes (Swiss QR-Invoice format)
  - Generate PDF invoices
  - Track payment status
  - Send invoice via email
- Integrate with `Transaction` via polymorphic relationship

**Frontend:**
- `pages/invoices/index.tsx` - Invoice list with status filters
- `pages/invoices/create.tsx` - Create invoice with line items
- `pages/invoices/[id]/edit.tsx` - Edit invoice
- `pages/invoices/[id]/view.tsx` - Invoice preview with PDF download
- `components/finance/invoice-preview.tsx` - Invoice template
- `components/finance/qr-code-display.tsx` - Display QR invoice
- Mark invoice as paid from transaction

**Features:**
- Create and send invoices
- Generate Swiss QR invoices
- Track invoice status (sent/paid/overdue)
- Automatic overdue reminders
- Link invoices to transactions
- Invoice templates
- Multi-currency invoices

#### 4.2 Receipt OCR & Attachments
**Backend:**
- Implement actual file uploads (replace placeholders):
  - Set up CDN integration (AWS S3, Cloudinary, etc.)
  - Update `TransactionAttachment` to store CDN URLs
- Create `OCRService`:
  - Integrate with OCR API (AWS Textract, Google Vision, etc.)
  - Extract amount, merchant, date from receipts
  - Auto-populate transaction fields
- Add OCR processing to attachment upload endpoint

**Frontend:**
- Update file upload components to use CDN
- `components/finance/receipt-scanner.tsx` - Camera/upload receipt
- `components/finance/ocr-preview.tsx` - Show extracted data
- Edit OCR results before creating transaction
- Thumbnail previews for attachments
- Full-size image viewer

**Features:**
- Upload receipt images to CDN
- OCR extraction of receipt data
- Auto-create transaction from receipt
- View/download attachments
- Mobile camera integration

---

### Phase 5: Insights & Advanced Analytics (Priority: Low)
**Timeline: 2-3 weeks**

#### 5.1 Spending Insights
**Backend:**
- Create `InsightsService`:
  - Analyze spending patterns
  - Identify unusual spending
  - Compare to previous periods
  - Detect spending trends
  - Category spending predictions
- Create `InsightsController`:
  - `GET /api/insights/overview` - General insights
  - `GET /api/insights/spending-patterns` - Pattern analysis
  - `GET /api/insights/recommendations` - Saving recommendations

**Frontend:**
- `pages/insights/index.tsx` - Insights dashboard
- `components/insights/spending-pattern-card.tsx` - Pattern visualizations
- `components/insights/recommendation-card.tsx` - Actionable tips
- `components/insights/anomaly-detector.tsx` - Unusual spending alerts
- Add insights widget to dashboard

**Features:**
- "You spent X% more this month"
- "Top growing category: Dining Out"
- "You could save X by reducing Y"
- Subscription optimization suggestions
- Unusual spending alerts
- Monthly spending scorecard

#### 5.2 Trends & Forecasting
**Frontend:**
- `pages/insights/trends.tsx` - Long-term trend analysis
- Spending velocity charts
- Savings rate trends
- Category trend comparisons
- Forecast future expenses based on history
- "At this rate, you'll save X by Y"

---

### Phase 6: Collaboration & Multi-User (Priority: Low)
**Timeline: 3-4 weeks**

#### 6.1 Family/Household Accounts
**Backend:**
- Create `households` table:
  ```sql
  id, name, owner_id, created_at, updated_at
  ```
- Create `household_members` table:
  ```sql
  id, household_id, user_id, role (owner/admin/member/viewer),
  can_create_transactions, can_edit_budgets, can_view_reports,
  created_at, updated_at
  ```
- Update all models to support household_id (optional)
- Create permission system for household members
- Create `HouseholdController` with member management

**Frontend:**
- `pages/household/index.tsx` - Household settings
- `pages/household/members.tsx` - Manage members
- Invite members via email
- Switch between personal/household view
- Permission-based UI hiding/showing

**Features:**
- Share accounts/budgets with family members
- Role-based permissions
- Separate personal and household transactions
- Household reports and budgets
- Member activity tracking

---

### Phase 7: Mobile Optimization & PWA (Priority: Medium)
**Timeline: 1-2 weeks**

**Features:**
- Progressive Web App (PWA) setup
- Offline mode with service workers
- Install app prompt
- Push notifications for:
  - Subscription reminders
  - Budget alerts
  - Bill due dates
  - Low balance warnings
- Mobile-specific UI improvements:
  - Bottom navigation
  - Swipe gestures
  - Pull-to-refresh
  - Quick action buttons
- Camera integration for receipt scanning
- Touch ID/Face ID for authentication (optional)

---

### Phase 8: Testing & Optimization (Ongoing)

**Backend Testing:**
- [ ] Full API endpoint test coverage with Pest
- [ ] Service layer unit tests
- [ ] Model relationship tests
- [ ] Validation tests for all Form Requests
- [ ] Queue job tests
- [ ] Scheduler command tests

**Frontend Testing:**
- [ ] Component tests with Vitest/React Testing Library
- [ ] E2E tests with Playwright or Cypress
- [ ] Accessibility testing
- [ ] Performance testing

**Optimization:**
- [ ] Database query optimization
- [ ] Add database indexes for common queries
- [ ] Implement Redis caching for reports
- [ ] Frontend bundle size optimization
- [ ] Image optimization for CDN
- [ ] API rate limiting refinement

---

## Feature Priority Matrix

### High Priority (Implement First)
1. **Subscriptions** - High value, frequently requested
2. **Recurring Income** - Complements subscriptions
3. **Budgets** - Core financial planning feature
4. **Reports & Analytics** - Essential for financial insights
5. **Export (CSV/PDF)** - Data portability

### Medium Priority (Implement Second)
1. **Import (CSV/Bank Statements)** - Saves manual entry time
2. **Invoices** - Useful for freelancers/small businesses
3. **Receipt OCR** - Nice to have, requires CDN setup
4. **PWA/Mobile Optimization** - Improves mobile experience

### Low Priority (Implement Later)
1. **Spending Insights** - Advanced analytics
2. **Multi-user/Household** - Complex, smaller audience
3. **Trends & Forecasting** - Advanced feature

---

## Technical Dependencies

### New Packages Needed
**Backend:**
- `barryvdh/laravel-dompdf` or `spatie/laravel-pdf` - PDF generation
- `simplesoftwareio/simple-qrcode` - QR code generation
- `league/csv` - CSV import/export
- `aws/aws-sdk-php` or similar - CDN integration
- `spatie/laravel-medialibrary` - Media management (optional)

**Frontend:**
- `recharts` or `chart.js` with `react-chartjs-2` - Charts
- `date-fns` - Date manipulation for reports
- `papaparse` - CSV parsing
- `react-dropzone` - File uploads
- `workbox` - PWA/Service workers

### Infrastructure
- CDN setup (AWS S3, Cloudinary, etc.)
- OCR API account (AWS Textract, Google Vision, etc.)
- Redis for caching (optional but recommended)
- Queue worker for background jobs
- Task scheduler for recurring tasks

---

## Development Workflow

For each feature:
1. Create database migrations
2. Create models with relationships
3. Write Pest tests for API endpoints
4. Implement controllers and services
5. Create API resources
6. Build frontend pages
7. Build frontend components
8. Add to navigation
9. Write frontend tests
10. Update documentation

---

## Estimated Timeline

- **Phase 1** (Subscriptions + Recurring Income): 2-3 weeks
- **Phase 2** (Budgets + Reports): 2-3 weeks
- **Phase 3** (Import/Export): 2 weeks
- **Phase 4** (Invoices + OCR): 2-3 weeks
- **Phase 5** (Insights): 2-3 weeks
- **Phase 6** (Multi-user): 3-4 weeks
- **Phase 7** (PWA/Mobile): 1-2 weeks

**Total: 14-20 weeks** for all post-MVP features

**Recommended Approach:**
Start with Phase 1 and Phase 2 (4-6 weeks) as they provide the most immediate value for personal finance management. Then assess user needs and prioritize remaining phases accordingly.
