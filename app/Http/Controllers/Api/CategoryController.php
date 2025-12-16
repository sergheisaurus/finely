<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCategoryRequest;
use App\Http\Requests\Api\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\TransactionResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->categories();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->boolean('tree')) {
            $query->whereNull('parent_id')->with('children');
        }

        if ($request->boolean('flat')) {
            $query->with('parent');
        }

        $categories = $query->withCount('transactions')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request): CategoryResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $category = Category::create($data);

        return new CategoryResource($category);
    }

    public function show(Request $request, Category $category): CategoryResource
    {
        $this->authorize('view', $category);

        $category->load(['parent', 'children']);
        $category->loadCount('transactions');

        return new CategoryResource($category);
    }

    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        $this->authorize('update', $category);

        $category->update($request->validated());
        $category->load(['parent', 'children']);

        return new CategoryResource($category);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->authorize('delete', $category);

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }

    public function transactions(Request $request, Category $category): AnonymousResourceCollection
    {
        $this->authorize('view', $category);

        $categoryIds = [$category->id];

        if ($category->isParent()) {
            $childIds = $category->children()->pluck('id')->toArray();
            $categoryIds = array_merge($categoryIds, $childIds);
        }

        $transactions = $category->user->transactions()
            ->whereIn('category_id', $categoryIds)
            ->with(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return TransactionResource::collection($transactions);
    }
}
