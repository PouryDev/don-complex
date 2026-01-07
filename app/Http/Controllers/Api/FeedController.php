<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeedItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class FeedController extends Controller
{
    /**
     * Display a listing of all feed items (news, forms, quizzes).
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $cacheKey = "feed_index_per_page_{$perPage}";
        
        // Cache feed items for 10 minutes
        $feedItems = Cache::remember($cacheKey, 600, function () use ($perPage) {
            $now = Carbon::now();

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
            $now = Carbon::now();

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
}
