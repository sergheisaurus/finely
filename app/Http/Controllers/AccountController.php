<?php

namespace App\Http\Controllers;

use App\Http\Resources\BankAccountResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(Request $request): Response
    {
        $accounts = $request->user()
            ->bankAccounts()
            ->withCount('cards')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        return Inertia::render('accounts/index', [
            'accounts' => BankAccountResource::collection($accounts),
        ]);
    }
}
