<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\SecretMode;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = $request->user()->categories()
            ->visibleForSecretMode(SecretMode::isActive($request))
            ->with(['parent', 'coverCategory'])
            ->withCount('transactions')
            ->orderBy('name')
            ->get();

        return Inertia::render('categories/index', [
            'categories' => CategoryResource::collection($categories),
        ]);
    }
}
