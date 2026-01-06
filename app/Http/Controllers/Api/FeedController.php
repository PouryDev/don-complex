<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeedItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class FeedController extends Controller
{
    /**
     * Display a listing of all feed items (news, forms, quizzes).
     */
    public function index(Request $request): JsonResponse
    {
        $now = Carbon::now();

        // Get active feed items that are scheduled (or have no schedule)
        $query = FeedItem::with('feedable')
            ->where('is_active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', $now);
            })
            ->orderBy('order')
            ->orderBy('scheduled_at', 'desc')
            ->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 15);
        $feedItems = $query->paginate($perPage);

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
        $now = Carbon::now();

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

        // Find the feed item by feedable type and id
        $feedItem = FeedItem::with('feedable')
            ->where('feedable_type', $modelClass)
            ->where('feedable_id', $id)
            ->where('is_active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', $now);
            })
            ->first();

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
