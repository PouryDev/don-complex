<?php

namespace App\Services;

use App\Models\DiscountCode;
use App\Models\User;
use App\Models\UserDiscountCode;
use App\Services\CoinService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DiscountCodeService
{
    protected CoinService $coinService;

    public function __construct(CoinService $coinService)
    {
        $this->coinService = $coinService;
    }

    /**
     * Create a discount code
     */
    public function createDiscountCode(array $data): DiscountCode
    {
        return DiscountCode::create($data);
    }

    /**
     * Purchase discount code with coins
     */
    public function purchaseWithCoins(User $user, DiscountCode $discountCode): UserDiscountCode
    {
        return DB::transaction(function () use ($user, $discountCode) {
            // Check if user already purchased this code
            $existing = UserDiscountCode::where('user_id', $user->id)
                ->where('discount_code_id', $discountCode->id)
                ->first();

            if ($existing) {
                throw new \Exception('شما قبلاً این کد تخفیف را خریداری کرده‌اید');
            }

            // Check if user has enough coins
            if (!$this->coinService->hasEnoughCoins($user, $discountCode->coins_cost)) {
                throw new \Exception('سکه کافی ندارید');
            }

            // Check if discount code is available
            if (!$discountCode->isValid()) {
                throw new \Exception('کد تخفیف در دسترس نیست');
            }

            // Spend coins
            $this->coinService->spendCoins($user, $discountCode->coins_cost, 'discount_purchase', $discountCode);

            // Create user discount code record
            $userDiscountCode = UserDiscountCode::create([
                'user_id' => $user->id,
                'discount_code_id' => $discountCode->id,
                'coins_spent' => $discountCode->coins_cost,
                'purchased_at' => now(),
            ]);

            return $userDiscountCode;
        });
    }

    /**
     * Validate discount code
     */
    public function validateCode(string $code, float $orderAmount): array
    {
        $cacheKey = "discount_code_{$code}";
        
        return Cache::remember($cacheKey, 300, function () use ($code, $orderAmount) {
            $discountCode = DiscountCode::where('code', $code)->first();

            if (!$discountCode) {
                return [
                    'valid' => false,
                    'message' => 'کد تخفیف یافت نشد',
                ];
            }

            if (!$discountCode->canBeUsed($orderAmount)) {
                $message = 'کد تخفیف معتبر نیست';
                
                if ($discountCode->expires_at && $discountCode->expires_at->isPast()) {
                    $message = 'کد تخفیف منقضی شده است';
                } elseif ($discountCode->max_uses && $discountCode->used_count >= $discountCode->max_uses) {
                    $message = 'تعداد استفاده از این کد تخفیف به پایان رسیده است';
                } elseif ($discountCode->min_order_amount && $orderAmount < $discountCode->min_order_amount) {
                    $message = "حداقل مبلغ سفارش باید {$discountCode->min_order_amount} تومان باشد";
                }

                return [
                    'valid' => false,
                    'message' => $message,
                ];
            }

            $discountAmount = $discountCode->apply($orderAmount);

            return [
                'valid' => true,
                'discount_code' => $discountCode,
                'discount_amount' => $discountAmount,
                'type' => $discountCode->type,
                'value' => $discountCode->value,
            ];
        });
    }

    /**
     * Apply discount to an amount
     */
    public function applyDiscount(DiscountCode $discountCode, float $amount): float
    {
        return $discountCode->apply($amount);
    }
}


