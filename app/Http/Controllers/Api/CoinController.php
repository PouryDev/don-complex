<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CoinResource;
use App\Http\Resources\CoinTransactionResource;
use App\Services\CoinService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CoinController extends Controller
{
    protected CoinService $coinService;

    public function __construct(CoinService $coinService)
    {
        $this->coinService = $coinService;
    }

    /**
     * Get user's coin balance
     */
    public function balance(Request $request): JsonResponse
    {
        $user = $request->user();
        $balance = $this->coinService->getBalance($user);

        return response()->json([
            'balance' => $balance,
        ]);
    }

    /**
     * Get coin transaction history
     */
    public function history(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $filters = $request->only(['type', 'source']);
        
        $perPage = $request->get('per_page', 20);
        
        $query = \App\Models\CoinTransaction::where('user_id', $user->id);

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return CoinTransactionResource::collection($transactions);
    }
}


