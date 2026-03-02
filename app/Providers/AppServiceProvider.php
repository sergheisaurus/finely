<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (str_contains(config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        Relation::enforceMorphMap([
            'card' => \App\Models\Card::class,
            'bank_account' => \App\Models\BankAccount::class,
            'subscription' => \App\Models\Subscription::class,
            'recurring_income' => \App\Models\RecurringIncome::class,
            'invoice' => \App\Models\Invoice::class,
            'order' => \App\Models\Order::class,
            'order_item' => \App\Models\OrderItem::class,
        ]);
    }
}
