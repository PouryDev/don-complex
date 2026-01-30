<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DiscountCodeResource;
use App\Http\Resources\UserDiscountCodeResource;
use App\Models\DiscountCode;
use App\Services\DiscountCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DiscountCodeController extends Controller
{
    protected DiscountCodeService $discountCodeService;

    public function __construct(DiscountCodeService $discountCodeService)
    {
        $this->discountCodeService = $discountCodeService;
    }

    /**
     * List available discount codes for purchase
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $discountCodes = DiscountCode::where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->orderBy('coins_cost', 'asc')
            ->get();

        return DiscountCodeResource::collection($discountCodes);
    }

    /**
     * Purchase discount code with coins
     */
    public function purchase(Request $request, DiscountCode $discountCode): JsonResponse
    {
        try {
            $user = $request->user();
            $userDiscountCode = $this->discountCodeService->purchaseWithCoins($user, $discountCode);

            return response()->json([
                'message' => 'کد تخفیف با موفقیت خریداری شد',
                'data' => new UserDiscountCodeResource($userDiscountCode->load('discountCode')),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get user's purchased discount codes
     */
    public function myCodes(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $userDiscountCodes = \App\Models\UserDiscountCode::where('user_id', $user->id)
            ->with('discountCode')
            ->orderBy('purchased_at', 'desc')
            ->get();

        return UserDiscountCodeResource::collection($userDiscountCodes);
    }

    /**
     * Validate discount code
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string'],
            'order_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $result = $this->discountCodeService->validateCode(
            $validated['code'],
            $validated['order_amount']
        );

        if (!$result['valid']) {
            return response()->json([
                'valid' => false,
                'message' => $result['message'],
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'discount_code' => new DiscountCodeResource($result['discount_code']),
            'discount_amount' => $result['discount_amount'],
            'type' => $result['type'],
            'value' => $result['value'],
        ]);
    }
}


