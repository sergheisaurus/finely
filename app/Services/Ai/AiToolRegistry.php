<?php

namespace App\Services\Ai;

use App\Models\BankAccount;
use App\Models\Card;
use App\Models\Category;
use App\Models\Merchant;
use App\Services\TransactionService;
use Illuminate\Http\Request;

class AiToolRegistry
{
    public function __construct(
        protected TransactionService $transactionService
    ) {}

    public function getTools(): array
    {
        return [
            [
                'name' => 'get_transactions',
                'description' => 'List and filter transactions. Use this to find transactions based on criteria like date, amount, category, or search text.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'search' => ['type' => 'string', 'description' => 'Search term for title or description'],
                        'type' => ['type' => 'string', 'enum' => ['income', 'expense', 'transfer', 'card_payment']],
                        'from_date' => ['type' => 'string', 'format' => 'date', 'description' => 'YYYY-MM-DD'],
                        'to_date' => ['type' => 'string', 'format' => 'date', 'description' => 'YYYY-MM-DD'],
                        'min_amount' => ['type' => 'number'],
                        'max_amount' => ['type' => 'number'],
                        'limit' => ['type' => 'integer', 'description' => 'Number of results to return (default 10)'],
                    ],
                ],
            ],
            [
                'name' => 'create_transaction',
                'description' => 'Create a new transaction. IMPORTANT: You MUST verify and provide a valid payment method (from_account_id OR from_card_id for expenses; to_account_id OR to_card_id for income). If the user did not specify a payment method, you MUST ask them "Which card or account did you use?" before calling this tool. You MUST also provide a category_id and merchant_id. If they do not exist, use create_category or create_merchant first.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'type' => ['type' => 'string', 'enum' => ['income', 'expense', 'transfer', 'card_payment']],
                        'amount' => ['type' => 'number'],
                        'transaction_date' => ['type' => 'string', 'format' => 'date'],
                        'title' => ['type' => 'string'],
                        'category_id' => ['type' => 'integer'],
                        'merchant_id' => ['type' => 'integer'],
                        'from_account_id' => ['type' => 'integer', 'nullable' => true, 'description' => 'Required for expense/transfer if no card used'],
                        'to_account_id' => ['type' => 'integer', 'nullable' => true, 'description' => 'Required for income/transfer'],
                        'from_card_id' => ['type' => 'integer', 'nullable' => true, 'description' => 'Required for expense if no account used'],
                        'to_card_id' => ['type' => 'integer', 'nullable' => true, 'description' => 'Required for income if no account used'],
                        'description' => ['type' => 'string', 'nullable' => true],
                    ],
                    'required' => ['type', 'amount', 'transaction_date', 'title', 'category_id', 'merchant_id'],
                ],
            ],
            [
                'name' => 'get_bank_accounts',
                'description' => 'List all bank accounts for the user. Use this to find account IDs.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => (object)[],
                ],
            ],
            [
                'name' => 'get_cards',
                'description' => 'List all credit and debit cards for the user. Use this to find card IDs.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => (object)[],
                ],
            ],
            [
                'name' => 'get_categories',
                'description' => 'List all transaction categories. Use this to find category IDs.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => (object)[],
                ],
            ],
            [
                'name' => 'create_category',
                'description' => 'Create a new transaction category. STRONGLY PREFER SUBCATEGORIES. Before creating a top-level category, check if a suitable parent exists (e.g., use parent_id of "Food" for "Groceries"). Only create top-level categories if no logical parent exists.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'name' => ['type' => 'string'],
                        'type' => ['type' => 'string', 'enum' => ['income', 'expense']],
                        'color' => ['type' => 'string', 'description' => 'Hex color code (e.g., #FF0000)'],
                        'parent_id' => ['type' => 'integer', 'nullable' => true],
                    ],
                    'required' => ['name', 'type'],
                ],
            ],
            [
                'name' => 'get_merchants',
                'description' => 'List all merchants. Use this to find merchant IDs.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => (object)[],
                ],
            ],
            [
                'name' => 'create_merchant',
                'description' => 'Create a new merchant.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'name' => ['type' => 'string'],
                        'category_id' => ['type' => 'integer', 'nullable' => true],
                    ],
                    'required' => ['name'],
                ],
            ],
        ];
    }

    public function executeTool(string $name, array $arguments, int $userId): mixed
    {
        switch ($name) {
            case 'get_transactions':
                $request = new Request($arguments);
                $request->merge(['per_page' => $arguments['limit'] ?? 10]);
                return $this->transactionService->getFilteredTransactions($request, $userId)->items();

            case 'create_transaction':
                $arguments['user_id'] = $userId;
                
                // Validate payment method presence
                $type = $arguments['type'] ?? 'expense';
                $hasPaymentMethod = false;

                if ($type === 'expense' || $type === 'card_payment') {
                    if (!empty($arguments['from_account_id']) || !empty($arguments['from_card_id'])) {
                        $hasPaymentMethod = true;
                    }
                } elseif ($type === 'income') {
                    if (!empty($arguments['to_account_id']) || !empty($arguments['to_card_id'])) {
                        $hasPaymentMethod = true;
                    }
                } elseif ($type === 'transfer') {
                    if ((!empty($arguments['from_account_id']) || !empty($arguments['from_card_id'])) &&
                        (!empty($arguments['to_account_id']) || !empty($arguments['to_card_id']))) {
                        $hasPaymentMethod = true;
                    }
                }

                if (!$hasPaymentMethod) {
                    throw new \Exception("Missing payment method. Please ask the user which account or card they used for this transaction.");
                }

                return $this->transactionService->createTransaction($arguments);

            case 'get_bank_accounts':
                return BankAccount::where('user_id', $userId)->get();

            case 'get_cards':
                return Card::where('user_id', $userId)->get()->map(function ($card) {
                    $card->decrypted_number = '**** ' . $card->last_four_digits;
                    return $card;
                });

            case 'get_categories':
                return Category::where('user_id', $userId)->get();

            case 'create_category':
                $arguments['user_id'] = $userId;
                
                if (!empty($arguments['parent_id'])) {
                    $parent = Category::find($arguments['parent_id']);
                    if ($parent && $parent->parent_id) {
                        throw new \Exception("Cannot create a subcategory under '{$parent->name}' because it is already a subcategory. Maximum nesting level is 2. Please create it under '{$parent->parent->name}' or as a top-level category.");
                    }
                }

                return Category::create($arguments);
            
            case 'get_merchants':
                return Merchant::where('user_id', $userId)->get();

            case 'create_merchant':
                $arguments['user_id'] = $userId;
                return Merchant::create($arguments);

            default:
                throw new \Exception("Tool {$name} not found.");
        }
    }
}
