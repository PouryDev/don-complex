<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoinRewardRule;
use App\Models\FeedItem;
use App\Services\CoinService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Helpers\TimezoneHelper;
use Illuminate\Support\Facades\Cache;

class FeedController extends Controller
{
    protected CoinService $coinService;

    public function __construct(CoinService $coinService)
    {
        $this->coinService = $coinService;
    }

    /**
     * Display a listing of all feed items (news, forms, quizzes).
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $cacheKey = "feed_index_per_page_{$perPage}";
        
        // Cache feed items for 10 minutes
        $feedItems = Cache::remember($cacheKey, 600, function () use ($perPage) {
            // scheduled_at is stored as UTC, so we compare with UTC
            $now = TimezoneHelper::now()->utc();

            // Get active feed items that are scheduled (or have no schedule)
            // Use select to only get needed columns for better performance
            $query = FeedItem::with('feedable')
                ->where('is_active', true)
                ->where(function ($query) use ($now) {
                    $query->whereNull('scheduled_at')
                        ->orWhere('scheduled_at', '<=', $now);
                })
                ->orderBy('order')
                ->orderBy('scheduled_at', 'desc')
                ->orderBy('created_at', 'desc');

            return $query->paginate($perPage);
        });

        $feed = $feedItems->getCollection()->map(function ($feedItem) {
            $item = $feedItem->feedable;
            
            if (!$item) {
                return null;
            }

            $baseData = [
                'id' => $item->id,
                'feed_item_id' => $feedItem->id,
                'type' => $this->getTypeFromModel($item),
                'title' => $item->title,
                'description' => $item->description,
                'badge' => $item->badge,
                'scheduled_at' => $feedItem->scheduled_at?->toISOString(),
                'created_at' => $item->created_at?->toISOString(),
                'updated_at' => $item->updated_at?->toISOString(),
            ];

            // Add type-specific fields
            switch ($baseData['type']) {
                case 'news':
                    $baseData['image_url'] = $item->image_url;
                    break;
                case 'form':
                    $baseData['fields'] = $item->fields;
                    break;
                case 'quiz':
                    $baseData['questions'] = $item->questions;
                    break;
            }

            return $baseData;
        })->filter()->values();

        // Set the transformed collection back to paginator
        $feedItems->setCollection($feed);

        return response()->json($feedItems);
    }

    /**
     * Display a single feed item by type and id.
     */
    public function show(Request $request, string $type, int $id): JsonResponse
    {
        // Map type to model class
        $typeMap = [
            'news' => 'App\Models\News',
            'form' => 'App\Models\Form',
            'quiz' => 'App\Models\Quiz',
        ];

        if (!isset($typeMap[$type])) {
            return response()->json(['message' => 'نوع نامعتبر'], 404);
        }

        $modelClass = $typeMap[$type];
        $cacheKey = "feed_show_{$type}_{$id}";
        
        // Cache individual feed items for 10 minutes
        $feedItem = Cache::remember($cacheKey, 600, function () use ($modelClass, $id) {
            // scheduled_at is stored as UTC, so we compare with UTC
            $now = TimezoneHelper::now()->utc();

            // Find the feed item by feedable type and id
            return FeedItem::with('feedable')
                ->where('feedable_type', $modelClass)
                ->where('feedable_id', $id)
                ->where('is_active', true)
                ->where(function ($query) use ($now) {
                    $query->whereNull('scheduled_at')
                        ->orWhere('scheduled_at', '<=', $now);
                })
                ->first();
        });

        if (!$feedItem || !$feedItem->feedable) {
            return response()->json(['message' => 'آیتم مورد نظر یافت نشد'], 404);
        }

        $item = $feedItem->feedable;

        $baseData = [
            'id' => $item->id,
            'feed_item_id' => $feedItem->id,
            'type' => $type,
            'title' => $item->title,
            'description' => $item->description,
            'badge' => $item->badge,
            'scheduled_at' => $feedItem->scheduled_at?->toISOString(),
            'created_at' => $item->created_at?->toISOString(),
            'updated_at' => $item->updated_at?->toISOString(),
        ];

        // Add type-specific fields
        switch ($type) {
            case 'news':
                $baseData['image_url'] = $item->image_url;
                break;
            case 'form':
                $baseData['fields'] = $item->fields;
                break;
            case 'quiz':
                $baseData['questions'] = $item->questions;
                break;
        }

        return response()->json($baseData);
    }

    /**
     * Get the type string from the model instance.
     */
    private function getTypeFromModel($model): string
    {
        $className = get_class($model);
        $typeMap = [
            'App\Models\News' => 'news',
            'App\Models\Form' => 'form',
            'App\Models\Quiz' => 'quiz',
        ];

        return $typeMap[$className] ?? 'unknown';
    }

    /**
     * Track feed item view and award coins
     */
    public function trackView(Request $request, string $type, int $id): JsonResponse
    {
        $user = $request->user();
        
        // Map type to model class
        $typeMap = [
            'news' => 'App\Models\News',
            'form' => 'App\Models\Form',
            'quiz' => 'App\Models\Quiz',
        ];

        if (!isset($typeMap[$type])) {
            return response()->json(['message' => 'نوع نامعتبر'], 404);
        }

        $modelClass = $typeMap[$type];
        $feedItem = FeedItem::where('feedable_type', $modelClass)
            ->where('feedable_id', $id)
            ->where('is_active', true)
            ->first();

        if (!$feedItem || !$feedItem->feedable) {
            return response()->json(['message' => 'آیتم مورد نظر یافت نشد'], 404);
        }

        $item = $feedItem->feedable;

        // Check if user already viewed this item today
        // created_at is stored as UTC, so we need to convert to UTC for comparison
        $today = TimezoneHelper::today();
        $todayStartUTC = $today->copy()->startOfDay()->utc();
        $todayEndUTC = $today->copy()->endOfDay()->utc();
        $existingView = \App\Models\CoinTransaction::where('user_id', $user->id)
            ->where('source', 'feed_view')
            ->where('related_type', $modelClass)
            ->where('related_id', $id)
            ->whereBetween('created_at', [$todayStartUTC, $todayEndUTC])
            ->first();

        if ($existingView) {
            return response()->json([
                'message' => 'شما امروز برای این محتوا سکه دریافت کرده‌اید',
                'coins_awarded' => 0,
            ]);
        }

        // Award coins based on reward rule
        $coinsAwarded = 0;
        $coins = CoinRewardRule::getCoinsFor($feedItem);
        if ($coins) {
            $this->coinService->awardCoins($user, $coins, 'feed_view', $feedItem);
            $coinsAwarded = $coins;
        }

        return response()->json([
            'message' => 'محتوا مشاهده شد',
            'coins_awarded' => $coinsAwarded,
        ]);
    }
}
