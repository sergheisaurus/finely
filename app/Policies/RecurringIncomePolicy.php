<?php

namespace App\Policies;

use App\Models\RecurringIncome;
use App\Models\User;

class RecurringIncomePolicy
{
    public function view(User $user, RecurringIncome $recurringIncome): bool
    {
        return $user->id === $recurringIncome->user_id;
    }

    public function update(User $user, RecurringIncome $recurringIncome): bool
    {
        return $user->id === $recurringIncome->user_id;
    }

    public function delete(User $user, RecurringIncome $recurringIncome): bool
    {
        return $user->id === $recurringIncome->user_id;
    }
}
