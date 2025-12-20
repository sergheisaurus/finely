<?php

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

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

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
});

require __DIR__.'/settings.php';
