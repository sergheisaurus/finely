<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        // Categories seem to be global based on the API controller logic
        $categories = Category::with(['parent'])
            ->withCount('transactions')
            ->orderBy('name')
            ->get();

        return Inertia::render('categories/index', [
            'categories' => CategoryResource::collection($categories),
        ]);
    }
}
