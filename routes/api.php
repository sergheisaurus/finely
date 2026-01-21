<?php

use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MerchantController;
use App\Http\Controllers\Api\PreferenceController;
use App\Http\Controllers\Api\RecurringIncomeController;
use App\Http\Controllers\Api\StatisticsController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TransferController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    // Bank Accounts
    Route::apiResource('accounts', BankAccountController::class);
    Route::post('accounts/{account}/set-default', [BankAccountController::class, 'setDefault']);
    Route::get('accounts/{account}/transactions', [BankAccountController::class, 'transactions']);

    // Cards
    Route::apiResource('cards', CardController::class);
    Route::post('cards/{card}/set-default', [CardController::class, 'setDefault']);
    Route::post('cards/{card}/pay-balance', [CardController::class, 'payBalance']);
    Route::get('cards/{card}/transactions', [CardController::class, 'transactions']);

    // Categories
    Route::apiResource('categories', CategoryController::class);
    Route::get('categories/{category}/transactions', [CategoryController::class, 'transactions']);

    // Merchants
    Route::apiResource('merchants', MerchantController::class);
    Route::get('merchants/{merchant}/transactions', [MerchantController::class, 'transactions']);

    // Transactions
    Route::apiResource('transactions', TransactionController::class);

    // Transfers
    Route::post('transfers', [TransferController::class, 'store']);

    // User Preferences
    Route::get('preferences', [PreferenceController::class, 'show']);
    Route::put('preferences', [PreferenceController::class, 'update']);

    // Subscriptions
    Route::get('subscriptions/upcoming', [SubscriptionController::class, 'upcoming']);
    Route::get('subscriptions/stats', [SubscriptionController::class, 'stats']);
    Route::apiResource('subscriptions', SubscriptionController::class);
    Route::post('subscriptions/{subscription}/toggle', [SubscriptionController::class, 'toggle']);
    Route::post('subscriptions/{subscription}/process', [SubscriptionController::class, 'process']);
    Route::get('subscriptions/{subscription}/transactions', [SubscriptionController::class, 'transactions']);

    // Recurring Incomes
    Route::get('recurring-incomes/upcoming', [RecurringIncomeController::class, 'upcoming']);
    Route::get('recurring-incomes/stats', [RecurringIncomeController::class, 'stats']);
    Route::apiResource('recurring-incomes', RecurringIncomeController::class);
    Route::post('recurring-incomes/{recurring_income}/toggle', [RecurringIncomeController::class, 'toggle']);
    Route::post('recurring-incomes/{recurring_income}/mark-received', [RecurringIncomeController::class, 'markReceived']);
    Route::get('recurring-incomes/{recurring_income}/transactions', [RecurringIncomeController::class, 'transactions']);

    // Invoices
    Route::get('invoices/stats', [InvoiceController::class, 'stats']);
    Route::get('invoices/upcoming', [InvoiceController::class, 'upcoming']);
    Route::get('invoices/overdue', [InvoiceController::class, 'overdue']);
    Route::post('invoices/parse-qr', [InvoiceController::class, 'parseQr']);
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('invoices/{invoice}/pay', [InvoiceController::class, 'pay']);
    Route::post('invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);
    Route::get('invoices/{invoice}/transactions', [InvoiceController::class, 'transactions']);
    Route::post('invoices/{invoice}/attachments', [InvoiceController::class, 'uploadAttachment']);
    Route::delete('invoices/{invoice}/attachments/{attachment}', [InvoiceController::class, 'deleteAttachment']);

    // Budgets
    Route::get('budgets/stats', [BudgetController::class, 'stats']);
    Route::get('budgets/health', [BudgetController::class, 'health']);
    Route::get('budgets/for-category', [BudgetController::class, 'forCategory']);
    Route::apiResource('budgets', BudgetController::class);
    Route::post('budgets/{budget}/toggle', [BudgetController::class, 'toggle']);
    Route::post('budgets/{budget}/refresh', [BudgetController::class, 'refresh']);
    Route::get('budgets/{budget}/breakdown', [BudgetController::class, 'breakdown']);
    Route::get('budgets/{budget}/comparison', [BudgetController::class, 'comparison']);
    Route::get('budgets/{budget}/check-impact', [BudgetController::class, 'checkImpact']);

    // AI Assistant
    Route::post('ai/chat', [\App\Http\Controllers\Api\AiController::class, 'chat']); // Legacy simple chat
    
    // Full AI Chat
    Route::apiResource('ai/conversations', \App\Http\Controllers\Api\AiChatController::class);
    Route::post('ai/conversations/{conversation}/messages', [\App\Http\Controllers\Api\AiChatController::class, 'sendMessage']);

    // AI Settings
    Route::get('settings/ai', [\App\Http\Controllers\Api\Settings\AiSettingsController::class, 'show']);
    Route::put('settings/ai', [\App\Http\Controllers\Api\Settings\AiSettingsController::class, 'update']);
    Route::get('settings/ai/stats', [\App\Http\Controllers\Api\Settings\AiSettingsController::class, 'stats']);

    // Statistics
    Route::get('statistics/overview', [StatisticsController::class, 'overview']);
    Route::get('statistics/snapshot', [StatisticsController::class, 'snapshot']);
    Route::get('statistics/net-worth-trend', [StatisticsController::class, 'netWorthTrend']);
    Route::get('statistics/cash-flow', [StatisticsController::class, 'cashFlow']);
    Route::get('statistics/top-categories', [StatisticsController::class, 'topCategories']);
    Route::get('statistics/top-merchants', [StatisticsController::class, 'topMerchants']);
});
