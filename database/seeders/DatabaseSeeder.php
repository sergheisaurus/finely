<?php

namespace Database\Seeders;

use App\Models\BankAccount;
use App\Models\Card;
use App\Models\Category;
use App\Models\Merchant;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        $this->seedBankAccounts($user);
        $this->seedCards($user);
        $this->seedCategories($user);
        $this->seedMerchants($user);
        $this->seedTransactions($user);
        $this->seedUserPreference($user);
    }

    private function seedBankAccounts(User $user): void
    {
        BankAccount::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Main Checking'],
            [
                'type' => 'checking',
                'balance' => 5432.50,
                'currency' => 'CHF',
                'bank_name' => 'UBS',
                'color' => '#f97316',
                'is_default' => true,
            ]
        );

        BankAccount::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Savings Account'],
            [
                'type' => 'savings',
                'balance' => 12500.00,
                'currency' => 'CHF',
                'bank_name' => 'UBS',
                'color' => '#22c55e',
                'is_default' => false,
            ]
        );

        BankAccount::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Revolut'],
            [
                'type' => 'checking',
                'balance' => 850.75,
                'currency' => 'CHF',
                'bank_name' => 'Revolut',
                'color' => '#6366f1',
                'is_default' => false,
            ]
        );
    }

    private function seedCards(User $user): void
    {
        $mainAccount = BankAccount::where('user_id', $user->id)->where('name', 'Main Checking')->first();

        Card::firstOrCreate(
            ['user_id' => $user->id, 'card_number' => '4532123456784532'],
            [
                'bank_account_id' => $mainAccount?->id,
                'type' => 'debit',
                'card_holder_name' => $user->name,
                'card_network' => 'visa',
                'expiry_month' => 12,
                'expiry_year' => 2027,
                'color' => '#1e293b',
                'is_default' => true,
            ]
        );

        Card::firstOrCreate(
            ['user_id' => $user->id, 'card_number' => '5500123456788891'],
            [
                'bank_account_id' => null,
                'type' => 'credit',
                'card_holder_name' => $user->name,
                'card_network' => 'mastercard',
                'expiry_month' => 6,
                'expiry_year' => 2026,
                'credit_limit' => 5000.00,
                'current_balance' => 1250.50,
                'payment_due_day' => 15,
                'billing_cycle_day' => 1,
                'color' => '#7c3aed',
                'is_default' => false,
            ]
        );
    }

    private function seedCategories(User $user): void
    {
        $expenseCategories = [
            ['name' => 'Food & Dining', 'icon' => 'utensils', 'color' => '#f97316', 'children' => ['Restaurants', 'Groceries', 'Coffee', 'Fast Food']],
            ['name' => 'Transportation', 'icon' => 'car', 'color' => '#3b82f6', 'children' => ['Fuel', 'Public Transport', 'Parking', 'Taxi/Uber']],
            ['name' => 'Shopping', 'icon' => 'shopping-bag', 'color' => '#ec4899', 'children' => ['Clothing', 'Electronics', 'Home Goods', 'Online Shopping']],
            ['name' => 'Entertainment', 'icon' => 'film', 'color' => '#8b5cf6', 'children' => ['Movies', 'Games', 'Streaming', 'Events']],
            ['name' => 'Bills & Utilities', 'icon' => 'home', 'color' => '#64748b', 'children' => ['Electricity', 'Internet', 'Phone', 'Water']],
            ['name' => 'Health & Fitness', 'icon' => 'heart', 'color' => '#ef4444', 'children' => ['Gym', 'Medical', 'Pharmacy', 'Sports']],
        ];

        $incomeCategories = [
            ['name' => 'Salary', 'icon' => 'briefcase', 'color' => '#22c55e', 'children' => ['Main Job', 'Bonus', 'Commission']],
            ['name' => 'Freelance', 'icon' => 'laptop', 'color' => '#06b6d4', 'children' => ['Projects', 'Consulting']],
            ['name' => 'Investments', 'icon' => 'trending-up', 'color' => '#eab308', 'children' => ['Dividends', 'Interest', 'Capital Gains']],
        ];

        foreach ($expenseCategories as $categoryData) {
            $parent = Category::firstOrCreate(
                ['user_id' => $user->id, 'name' => $categoryData['name'], 'parent_id' => null],
                [
                    'icon' => $categoryData['icon'],
                    'color' => $categoryData['color'],
                    'type' => 'expense',
                ]
            );

            foreach ($categoryData['children'] as $childName) {
                Category::firstOrCreate(
                    ['user_id' => $user->id, 'name' => $childName, 'parent_id' => $parent->id],
                    [
                        'icon' => $categoryData['icon'],
                        'color' => $categoryData['color'],
                        'type' => 'expense',
                    ]
                );
            }
        }

        foreach ($incomeCategories as $categoryData) {
            $parent = Category::firstOrCreate(
                ['user_id' => $user->id, 'name' => $categoryData['name'], 'parent_id' => null],
                [
                    'icon' => $categoryData['icon'],
                    'color' => $categoryData['color'],
                    'type' => 'income',
                ]
            );

            foreach ($categoryData['children'] as $childName) {
                Category::firstOrCreate(
                    ['user_id' => $user->id, 'name' => $childName, 'parent_id' => $parent->id],
                    [
                        'icon' => $categoryData['icon'],
                        'color' => $categoryData['color'],
                        'type' => 'income',
                    ]
                );
            }
        }
    }

    private function seedMerchants(User $user): void
    {
        $companies = ['Amazon', 'Netflix', 'Spotify', 'Albert Heijn', 'Shell', 'McDonald\'s', 'IKEA', 'Apple'];
        $people = ['John Smith', 'Jane Doe', 'Michael Johnson'];

        foreach ($companies as $name) {
            Merchant::firstOrCreate(
                ['user_id' => $user->id, 'name' => $name],
                ['type' => 'company', 'image_path' => null]
            );
        }

        foreach ($people as $name) {
            Merchant::firstOrCreate(
                ['user_id' => $user->id, 'name' => $name],
                ['type' => 'person', 'image_path' => null]
            );
        }
    }

    private function seedTransactions(User $user): void
    {
        $account = BankAccount::where('user_id', $user->id)->where('is_default', true)->first();
        $card = Card::where('user_id', $user->id)->where('type', 'credit')->first();

        if (! $account) {
            return;
        }

        $groceriesCategory = Category::where('user_id', $user->id)->where('name', 'Groceries')->first();
        $restaurantsCategory = Category::where('user_id', $user->id)->where('name', 'Restaurants')->first();
        $salaryCategory = Category::where('user_id', $user->id)->where('name', 'Main Job')->first();

        $albertHeijn = Merchant::where('user_id', $user->id)->where('name', 'Albert Heijn')->first();
        $amazon = Merchant::where('user_id', $user->id)->where('name', 'Amazon')->first();

        Transaction::firstOrCreate(
            ['user_id' => $user->id, 'title' => 'Monthly Salary', 'transaction_date' => now()->startOfMonth()],
            [
                'type' => 'income',
                'amount' => 3500.00,
                'currency' => 'CHF',
                'description' => 'December salary',
                'to_account_id' => $account->id,
                'category_id' => $salaryCategory?->id,
            ]
        );

        Transaction::firstOrCreate(
            ['user_id' => $user->id, 'title' => 'Weekly groceries', 'transaction_date' => now()->subDays(2)],
            [
                'type' => 'expense',
                'amount' => 85.50,
                'currency' => 'CHF',
                'from_account_id' => $account->id,
                'category_id' => $groceriesCategory?->id,
                'merchant_id' => $albertHeijn?->id,
            ]
        );

        if ($card) {
            Transaction::firstOrCreate(
                ['user_id' => $user->id, 'title' => 'Amazon purchase', 'transaction_date' => now()->subDays(5)],
                [
                    'type' => 'expense',
                    'amount' => 149.99,
                    'currency' => 'CHF',
                    'from_card_id' => $card->id,
                    'category_id' => Category::where('user_id', $user->id)->where('name', 'Online Shopping')->first()?->id,
                    'merchant_id' => $amazon?->id,
                ]
            );
        }

        Transaction::firstOrCreate(
            ['user_id' => $user->id, 'title' => 'Dinner with friends', 'transaction_date' => now()->subDays(3)],
            [
                'type' => 'expense',
                'amount' => 45.00,
                'currency' => 'CHF',
                'from_account_id' => $account->id,
                'category_id' => $restaurantsCategory?->id,
            ]
        );
    }

    private function seedUserPreference(User $user): void
    {
        $defaultAccount = BankAccount::where('user_id', $user->id)->where('is_default', true)->first();
        $defaultCard = Card::where('user_id', $user->id)->where('is_default', true)->first();

        UserPreference::firstOrCreate(
            ['user_id' => $user->id],
            [
                'default_account_id' => $defaultAccount?->id,
                'default_card_id' => $defaultCard?->id,
                'currency' => 'CHF',
            ]
        );
    }
}
