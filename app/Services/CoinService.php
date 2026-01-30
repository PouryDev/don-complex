<?php

namespace App\Services;

use App\Models\Coin;
use App\Models\CoinTransaction;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;

class CoinService
{
    /**
     * Award coins to a user
     */
    public function awardCoins(User $user, int $amount, string $source, $related = null): CoinTransaction
    {
        return DB::transaction(function () use ($user, $amount, $source, $related) {
            // Get or create coin record for user
            $coin = Coin::firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0]
            );

            // Increment balance
            $coin->incrementBalance($amount);

            // Create transaction record
            $transaction = CoinTransaction::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'type' => 'earned',
                'source' => $source,
                'description' => $this->getDescriptionForSource($source, $related),
                'related_id' => $related ? $related->id : null,
                'related_type' => $related ? get_class($related) : null,
                'created_at' => now(),
            ]);

            // Clear cache
            Cache::forget("user_coins_{$user->id}");

            return $transaction;
        });
    }

    /**
     * Spend coins from a user
     */
    public function spendCoins(User $user, int $amount, string $source, $related = null): CoinTransaction
    {
        return DB::transaction(function () use ($user, $amount, $source, $related) {
            // Lock coin row for update
            $coin = Coin::where('user_id', $user->id)->lockForUpdate()->first();

            if (!$coin) {
                throw new \Exception('User does not have a coin account');
            }

            if ($coin->balance < $amount) {
                throw new \Exception('Insufficient coins');
            }

            // Decrement balance
            $coin->decrementBalance($amount);

            // Create transaction record
            $transaction = CoinTransaction::create([
                'user_id' => $user->id,
                'amount' => -$amount,
                'type' => 'spent',
                'source' => $source,
                'description' => $this->getDescriptionForSource($source, $related),
                'related_id' => $related ? $related->id : null,
                'related_type' => $related ? get_class($related) : null,
                'created_at' => now(),
            ]);

            // Clear cache
            Cache::forget("user_coins_{$user->id}");

            return $transaction;
        });
    }

    /**
     * Get user's coin balance
     */
    public function getBalance(User $user): int
    {
        return Cache::remember("user_coins_{$user->id}", 60, function () use ($user) {
            $coin = Coin::where('user_id', $user->id)->first();
            return $coin ? $coin->balance : 0;
        });
    }

    /**
     * Get coin transaction history
     */
    public function getHistory(User $user, array $filters = []): Collection
    {
        $query = CoinTransaction::where('user_id', $user->id);

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Check if user has enough coins
     */
    public function hasEnoughCoins(User $user, int $amount): bool
    {
        return $this->getBalance($user) >= $amount;
    }

    /**
     * Get description for transaction source
     */
    private function getDescriptionForSource(string $source, $related = null): ?string
    {
        $descriptions = [
            'quiz' => 'پاسخ به کوییز',
            'form' => 'پر کردن فرم',
            'reservation' => 'رزرو سانس',
            'feed_view' => 'مشاهده محتوا',
            'discount_purchase' => 'خرید کد تخفیف',
            'ticket_purchase' => 'خرید بلیط رایگان',
        ];

        $description = $descriptions[$source] ?? $source;

        if ($related) {
            if (method_exists($related, 'title')) {
                $description .= ': ' . $related->title;
            } elseif (method_exists($related, 'name')) {
                $description .= ': ' . $related->name;
            }
        }

        return $description;
    }
}


