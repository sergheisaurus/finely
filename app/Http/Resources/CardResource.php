<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bank_account_id' => $this->bank_account_id,
            'type' => $this->type,
            'card_holder_name' => $this->card_holder_name,
            'card_number' => $this->card_number,
            'last_four_digits' => $this->last_four_digits,
            'card_network' => $this->card_network,
            'expiry_month' => $this->expiry_month,
            'expiry_year' => $this->expiry_year,
            'expiry_date' => $this->expiry_date,
            'is_expired' => $this->isExpired(),
            'credit_limit' => $this->when($this->isCredit(), (float) $this->credit_limit),
            'current_balance' => (float) $this->current_balance,
            'available_credit' => $this->when($this->isCredit(), $this->available_credit),
            'payment_due_day' => $this->when($this->isCredit(), $this->payment_due_day),
            'billing_cycle_day' => $this->when($this->isCredit(), $this->billing_cycle_day),
            'color' => $this->color,
            'is_default' => $this->is_default,
            'bank_account' => new BankAccountResource($this->whenLoaded('bankAccount')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
