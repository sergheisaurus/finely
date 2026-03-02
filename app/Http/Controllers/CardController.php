<?php

namespace App\Http\Controllers;

use App\Http\Resources\CardResource;
use App\Models\Card;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $cards = Card::whereHas('bankAccount', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['bankAccount'])
        ->orderBy('is_default', 'desc')
        ->orderBy('card_holder_name')
        ->get();

        return Inertia::render('cards/index', [
            'cards' => CardResource::collection($cards),
        ]);
    }
}
