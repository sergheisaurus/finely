<?php

use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CdnController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MerchantController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\OrderController;
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

Route::name('api.')->middleware('auth:sanctum')->group(function () {
    // Bank Accounts
    Route::apiResource('accounts', BankAccountController::class);
    Route::post('accounts/{account}/set-default', [BankAccountController::class, 'setDefault'])->name('accounts.set-default');
    Route::get('accounts/{account}/transactions', [BankAccountController::class, 'transactions'])->name('accounts.transactions');

    // Cards
    Route::apiResource('cards', CardController::class);
    Route::post('cards/{card}/set-default', [CardController::class, 'setDefault'])->name('cards.set-default');
    Route::post('cards/{card}/pay-balance', [CardController::class, 'payBalance'])->name('cards.pay-balance');
    Route::get('cards/{card}/transactions', [CardController::class, 'transactions'])->name('cards.transactions');

    // Categories
    Route::apiResource('categories', CategoryController::class);
    Route::get('categories/{category}/transactions', [CategoryController::class, 'transactions'])->name('categories.transactions');

    // Merchants
    Route::apiResource('merchants', MerchantController::class);
    Route::get('merchants/{merchant}/transactions', [MerchantController::class, 'transactions'])->name('merchants.transactions');

    // Transactions
    Route::get('transactions/{transaction}/split-group', [TransactionController::class, 'splitGroup'])->name('transactions.split-group');
    Route::apiResource('transactions', TransactionController::class);

    // Transfers
    Route::post('transfers', [TransferController::class, 'store'])->name('transfers.store');

    // User Preferences
    Route::get('preferences', [PreferenceController::class, 'show'])->name('preferences.show');
    Route::put('preferences', [PreferenceController::class, 'update'])->name('preferences.update');

    // Subscriptions
    Route::get('subscriptions/upcoming', [SubscriptionController::class, 'upcoming'])->name('subscriptions.upcoming');
    Route::get('subscriptions/stats', [SubscriptionController::class, 'stats'])->name('subscriptions.stats');
    Route::apiResource('subscriptions', SubscriptionController::class);
    Route::post('subscriptions/{subscription}/toggle', [SubscriptionController::class, 'toggle'])->name('subscriptions.toggle');
    Route::post('subscriptions/{subscription}/process', [SubscriptionController::class, 'process'])->name('subscriptions.process');
    Route::get('subscriptions/{subscription}/transactions', [SubscriptionController::class, 'transactions'])->name('subscriptions.transactions');

    // Recurring Incomes
    Route::get('recurring-incomes/upcoming', [RecurringIncomeController::class, 'upcoming'])->name('recurring-incomes.upcoming');
    Route::get('recurring-incomes/stats', [RecurringIncomeController::class, 'stats'])->name('recurring-incomes.stats');
    Route::apiResource('recurring-incomes', RecurringIncomeController::class);
    Route::post('recurring-incomes/{recurring_income}/toggle', [RecurringIncomeController::class, 'toggle'])->name('recurring-incomes.toggle');
    Route::post('recurring-incomes/{recurring_income}/mark-received', [RecurringIncomeController::class, 'markReceived'])->name('recurring-incomes.mark-received');
    Route::post('recurring-incomes/{recurring_income}/rollback-last-received', [RecurringIncomeController::class, 'rollbackLastReceived'])->name('recurring-incomes.rollback-last-received');
    Route::get('recurring-incomes/{recurring_income}/salary-adjustments', [RecurringIncomeController::class, 'salaryAdjustments'])->name('recurring-incomes.salary-adjustments');
    Route::post('recurring-incomes/{recurring_income}/salary-adjustments', [RecurringIncomeController::class, 'storeSalaryAdjustment'])->name('recurring-incomes.salary-adjustments.store');
    Route::get('recurring-incomes/{recurring_income}/transactions', [RecurringIncomeController::class, 'transactions'])->name('recurring-incomes.transactions');

    // Invoices
    Route::get('invoices/stats', [InvoiceController::class, 'stats'])->name('invoices.stats');
    Route::get('invoices/upcoming', [InvoiceController::class, 'upcoming'])->name('invoices.upcoming');
    Route::get('invoices/overdue', [InvoiceController::class, 'overdue'])->name('invoices.overdue');
    Route::post('invoices/parse-qr', [InvoiceController::class, 'parseQr'])->name('invoices.parse-qr');
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('invoices/{invoice}/pay', [InvoiceController::class, 'pay'])->name('invoices.pay');
    Route::post('invoices/{invoice}/cancel', [InvoiceController::class, 'cancel'])->name('invoices.cancel');
    Route::get('invoices/{invoice}/transactions', [InvoiceController::class, 'transactions'])->name('invoices.transactions');
    Route::post('invoices/{invoice}/attachments', [InvoiceController::class, 'uploadAttachment'])->name('invoices.attachments.store');
    Route::delete('invoices/{invoice}/attachments/{attachment}', [InvoiceController::class, 'deleteAttachment'])->name('invoices.attachments.destroy');

    // Orders
    Route::apiResource('orders', OrderController::class);
    Route::get('orders/{order}/transactions', [OrderController::class, 'transactions'])->name('orders.transactions');
    Route::post('orders/{order}/link-transaction', [OrderController::class, 'linkTransaction'])->name('orders.link-transaction');

    // Inventory
    Route::get('inventory/items', [InventoryController::class, 'index'])->name('inventory.items');
    Route::post('inventory/items/{item}/image', [InventoryController::class, 'uploadImage'])->name('inventory.items.image.upload');
    Route::delete('inventory/items/{item}/image/{asset}', [InventoryController::class, 'deleteImage'])->name('inventory.items.image.delete');
    Route::post('inventory/items/{item}/cover-image', [InventoryController::class, 'setCoverImage'])->name('inventory.items.cover-image.update');

    // Integrations
    Route::get('integrations/cdn/health', [CdnController::class, 'health'])->name('integrations.cdn.health');
    Route::post('integrations/cdn/bootstrap', [CdnController::class, 'bootstrap'])->name('integrations.cdn.bootstrap');
    Route::get('integrations/cdn/files/{file}/media', [CdnController::class, 'media'])->name('integrations.cdn.files.media');

    // Budgets
    Route::get('budgets/stats', [BudgetController::class, 'stats'])->name('budgets.stats');
    Route::get('budgets/health', [BudgetController::class, 'health'])->name('budgets.health');
    Route::get('budgets/for-category', [BudgetController::class, 'forCategory'])->name('budgets.for-category');
    Route::apiResource('budgets', BudgetController::class);
    Route::post('budgets/{budget}/toggle', [BudgetController::class, 'toggle'])->name('budgets.toggle');
    Route::post('budgets/{budget}/refresh', [BudgetController::class, 'refresh'])->name('budgets.refresh');
    Route::get('budgets/{budget}/breakdown', [BudgetController::class, 'breakdown'])->name('budgets.breakdown');
    Route::get('budgets/{budget}/history', [BudgetController::class, 'history'])->name('budgets.history');
    Route::get('budgets/{budget}/comparison', [BudgetController::class, 'comparison'])->name('budgets.comparison');
    Route::get('budgets/{budget}/check-impact', [BudgetController::class, 'checkImpact'])->name('budgets.check-impact');

    // AI Assistant
    Route::post('ai/chat', [\App\Http\Controllers\Api\AiController::class, 'chat'])->name('ai.chat'); // Legacy simple chat
    
    // Full AI Chat
    Route::apiResource('ai/conversations', \App\Http\Controllers\Api\AiChatController::class);
    Route::post('ai/conversations/{conversation}/messages', [\App\Http\Controllers\Api\AiChatController::class, 'sendMessage'])->name('ai.conversations.messages');

    // AI Settings
    Route::get('settings/ai', [\App\Http\Controllers\Api\Settings\AiSettingsController::class, 'show'])->name('settings.ai.show');
    Route::put('settings/ai', [\App\Http\Controllers\Api\Settings\AiSettingsController::class, 'update'])->name('settings.ai.update');
    Route::get('settings/ai/stats', [\App\Http\Controllers\Api\Settings\AiSettingsController::class, 'stats'])->name('settings.ai.stats');

    // Statistics
    Route::get('statistics/overview', [StatisticsController::class, 'overview'])->name('statistics.overview');
    Route::get('statistics/snapshot', [StatisticsController::class, 'snapshot'])->name('statistics.snapshot');
    Route::get('statistics/net-worth-trend', [StatisticsController::class, 'netWorthTrend'])->name('statistics.net-worth-trend');
    Route::get('statistics/cash-flow', [StatisticsController::class, 'cashFlow'])->name('statistics.cash-flow');
    Route::get('statistics/top-categories', [StatisticsController::class, 'topCategories'])->name('statistics.top-categories');
    Route::get('statistics/top-merchants', [StatisticsController::class, 'topMerchants'])->name('statistics.top-merchants');
    Route::get('statistics/forecast', [StatisticsController::class, 'forecast'])->name('statistics.forecast');
    Route::post('statistics/forecast', [StatisticsController::class, 'forecast'])->name('statistics.forecast.post');
});
