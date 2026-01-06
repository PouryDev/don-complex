<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeedItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class FeedController extends Controller
{
    /**
     * Display a listing of all feed items (news, forms, quizzes).
     */
    public function index(): JsonResponse
    {
        $now = Carbon::now();

        // Get active feed items that are scheduled (or have no schedule)
        $feedItems = FeedItem::with('feedable')
            ->where('is_active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', $now);
            })
            ->orderBy('order')
            ->orderBy('scheduled_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $feed = $feedItems->map(function ($feedItem) {
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

        return response()->json($feed);
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
