<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFormResponseRequest;
use App\Http\Resources\FormResponseResource;
use App\Models\CoinRewardRule;
use App\Models\Form;
use App\Models\FormResponse;
use App\Services\CoinService;
use Illuminate\Http\JsonResponse;

class FormResponseController extends Controller
{
    protected CoinService $coinService;

    public function __construct(CoinService $coinService)
    {
        $this->coinService = $coinService;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreFormResponseRequest $request, Form $form): JsonResponse|FormResponseResource
    {
        $user = $request->user();
        $validated = $request->validated();
        $data = $validated['data'];

        try {
            $response = FormResponse::create([
                'user_id' => $user->id,
                'form_id' => $form->id,
                'data' => $data,
            ]);

            // Award coins based on reward rule
            $coinsAwarded = 0;
            $coins = CoinRewardRule::getCoinsFor($form);
            if ($coins) {
                // Check if user already received coins for this form
                $existingTransaction = \App\Models\CoinTransaction::where('user_id', $user->id)
                    ->where('source', 'form')
                    ->where('related_type', get_class($form))
                    ->where('related_id', $form->id)
                    ->first();

                if (!$existingTransaction) {
                    $this->coinService->awardCoins($user, $coins, 'form', $form);
                    $coinsAwarded = $coins;
                }
            }

            $response->coins_awarded = $coinsAwarded;

            return new FormResponseResource($response);
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle duplicate submission error
            if ($e->getCode() === '23000') { // SQLSTATE[23000]: Integrity constraint violation
                return response()->json([
                    'message' => 'شما قبلاً این فرم را پر کرده‌اید.'
                ], 409);
            }
            throw $e;
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Form $form): JsonResponse|FormResponseResource
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $response = FormResponse::where('user_id', $user->id)
            ->where('form_id', $form->id)
            ->first();

        if (!$response) {
            return response()->json(['message' => 'پاسخی یافت نشد'], 404);
        }

        return new FormResponseResource($response);
    }
}
