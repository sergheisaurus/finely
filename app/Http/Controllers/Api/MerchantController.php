<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreMerchantRequest;
use App\Http\Requests\Api\UpdateMerchantRequest;
use App\Http\Resources\MerchantResource;
use App\Http\Resources\TransactionResource;
use App\Models\Merchant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MerchantController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->merchants();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        $merchants = $query->withCount('transactions')
            ->orderBy('name')
            ->get();

        return MerchantResource::collection($merchants);
    }

    public function store(StoreMerchantRequest $request): MerchantResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $merchant = Merchant::create($data);

        return new MerchantResource($merchant);
    }

    public function show(Request $request, Merchant $merchant): MerchantResource
    {
        $this->authorize('view', $merchant);

        $merchant->loadCount('transactions');

        return new MerchantResource($merchant);
    }

    public function update(UpdateMerchantRequest $request, Merchant $merchant): MerchantResource
    {
        $this->authorize('update', $merchant);

        $merchant->update($request->validated());

        return new MerchantResource($merchant);
    }

    public function destroy(Request $request, Merchant $merchant): JsonResponse
    {
        $this->authorize('delete', $merchant);

        $merchant->delete();

        return response()->json(['message' => 'Merchant deleted successfully']);
    }

    public function transactions(Request $request, Merchant $merchant): AnonymousResourceCollection
    {
        $this->authorize('view', $merchant);

        $transactions = $merchant->transactions()
            ->with(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return TransactionResource::collection($transactions);
    }
}
