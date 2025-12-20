<?php

use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MerchantController;
use App\Http\Controllers\Api\PreferenceController;
use App\Http\Controllers\Api\RecurringIncomeController;
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
});
