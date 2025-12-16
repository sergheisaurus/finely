<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
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
});

require __DIR__.'/settings.php';
