<?php

namespace App\Http\Controllers;

use App\Http\Resources\MerchantResource;
use App\Models\Merchant;
use App\Support\SecretMode;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MerchantController extends Controller
{
    public function index(Request $request): Response
    {
        $merchants = $request->user()->merchants()
            ->visibleForSecretMode(SecretMode::isActive($request))
            ->with('coverMerchant')
            ->withCount('transactions')
            ->orderBy('name')
            ->get();

        return Inertia::render('merchants/index', [
            'merchants' => MerchantResource::collection($merchants),
        ]);
    }
}
