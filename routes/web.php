<?php

use App\Http\Controllers\OnboardingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Route::has('register'),
    ]);
})->name('home');

Route::get('/home', function () {
    return redirect()->route('dashboard');
})->middleware(['auth', 'verified']);

// Onboarding routes (auth required, but NOT onboarding middleware)
Route::middleware(['auth', 'verified'])->prefix('onboarding')->name('onboarding.')->group(function () {
    Route::get('/', [OnboardingController::class, 'index'])->name('index');
    Route::post('/account', [OnboardingController::class, 'storeAccount'])->name('store-account');
    Route::post('/cards', [OnboardingController::class, 'storeCards'])->name('store-cards');
    Route::post('/subscriptions', [OnboardingController::class, 'storeSubscriptions'])->name('store-subscriptions');
    Route::post('/incomes', [OnboardingController::class, 'storeIncomes'])->name('store-incomes');
    Route::post('/complete', [OnboardingController::class, 'complete'])->name('complete');
    Route::post('/skip', [OnboardingController::class, 'skip'])->name('skip');
});

Route::middleware(['auth', 'verified', 'onboarding'])->group(function () {
    // Dashboard
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Statistics
    Route::get('statistics', function () {
        return Inertia::render('statistics/index');
    })->name('statistics');

    // Journal (Transactions)
    Route::get('journal', function () {
        return Inertia::render('journal/index');
    })->name('journal');

    Route::get('journal/create', function () {
        return Inertia::render('journal/create');
    })->name('journal.create');

    Route::get('journal/{id}/edit', function ($id) {
        return Inertia::render('journal/edit', ['transactionId' => $id]);
    })->name('journal.edit');

    // Bank Accounts
    Route::get('accounts', function () {
        return Inertia::render('accounts/index');
    })->name('accounts.index');

    Route::get('accounts/create', function () {
        return Inertia::render('accounts/create');
    })->name('accounts.create');

    Route::get('accounts/{id}', function ($id) {
        return Inertia::render('accounts/view', ['accountId' => $id]);
    })->name('accounts.view');

    Route::get('accounts/{id}/edit', function ($id) {
        return Inertia::render('accounts/edit', ['accountId' => $id]);
    })->name('accounts.edit');

    // Cards
    Route::get('cards', function () {
        return Inertia::render('cards/index');
    })->name('cards.index');

    Route::get('cards/create', function () {
        return Inertia::render('cards/create');
    })->name('cards.create');

    Route::get('cards/{id}', function ($id) {
        return Inertia::render('cards/view', ['cardId' => $id]);
    })->name('cards.view');

    Route::get('cards/{id}/edit', function ($id) {
        return Inertia::render('cards/edit', ['cardId' => $id]);
    })->name('cards.edit');

    // Categories
    Route::get('categories', function () {
        return Inertia::render('categories/index');
    })->name('categories.index');

    Route::get('categories/create', function () {
        return Inertia::render('categories/create');
    })->name('categories.create');

    Route::get('categories/{id}/edit', function ($id) {
        return Inertia::render('categories/edit', ['categoryId' => $id]);
    })->name('categories.edit');

    // Merchants
    Route::get('merchants', function () {
        return Inertia::render('merchants/index');
    })->name('merchants.index');

    Route::get('merchants/create', function () {
        return Inertia::render('merchants/create');
    })->name('merchants.create');

    Route::get('merchants/{id}/edit', function ($id) {
        return Inertia::render('merchants/edit', ['merchantId' => $id]);
    })->name('merchants.edit');

    // Subscriptions
    Route::get('subscriptions', function () {
        return Inertia::render('subscriptions/index');
    })->name('subscriptions.index');

    Route::get('subscriptions/create', function () {
        return Inertia::render('subscriptions/create');
    })->name('subscriptions.create');

    Route::get('subscriptions/{id}', function ($id) {
        return Inertia::render('subscriptions/view', ['subscriptionId' => $id]);
    })->name('subscriptions.view');

    Route::get('subscriptions/{id}/edit', function ($id) {
        return Inertia::render('subscriptions/edit', ['subscriptionId' => $id]);
    })->name('subscriptions.edit');

    // Recurring Income
    Route::get('income', function () {
        return Inertia::render('income/index');
    })->name('income.index');

    Route::get('income/create', function () {
        return Inertia::render('income/create');
    })->name('income.create');

    Route::get('income/{id}', function ($id) {
        return Inertia::render('income/view', ['incomeId' => $id]);
    })->name('income.view');

    Route::get('income/{id}/edit', function ($id) {
        return Inertia::render('income/edit', ['incomeId' => $id]);
    })->name('income.edit');

    // Invoices
    Route::get('invoices', function () {
        return Inertia::render('invoices/index');
    })->name('invoices.index');

    Route::get('invoices/create', function () {
        return Inertia::render('invoices/create');
    })->name('invoices.create');

    Route::get('invoices/{id}', function ($id) {
        return Inertia::render('invoices/view', ['invoiceId' => $id]);
    })->name('invoices.view');

    Route::get('invoices/{id}/edit', function ($id) {
        return Inertia::render('invoices/edit', ['invoiceId' => $id]);
    })->name('invoices.edit');

    // Budgets
    Route::get('budgets', function () {
        return Inertia::render('budgets/index');
    })->name('budgets.index');

    Route::get('budgets/create', function () {
        return Inertia::render('budgets/create');
    })->name('budgets.create');

    Route::get('budgets/{id}', function ($id) {
        return Inertia::render('budgets/view', ['budgetId' => $id]);
    })->name('budgets.view');

    Route::get('budgets/{id}/edit', function ($id) {
        return Inertia::render('budgets/edit', ['budgetId' => $id]);
    })->name('budgets.edit');

    // AI Chat
    Route::get('chat', function () {
        return Inertia::render('chat/index');
    })->name('chat.index');
});

require __DIR__.'/settings.php';
