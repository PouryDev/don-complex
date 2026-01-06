<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\Form;
use App\Models\Quiz;
use Illuminate\Http\JsonResponse;

class FeedController extends Controller
{
    /**
     * Display a listing of all feed items (news, forms, quizzes).
     */
    public function index(): JsonResponse
    {
        $news = News::orderBy('created_at', 'desc')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'type' => 'news',
                'title' => $item->title,
                'description' => $item->description,
                'badge' => $item->badge,
                'image_url' => $item->image_url,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];
        });

        $forms = Form::orderBy('created_at', 'desc')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'type' => 'form',
                'title' => $item->title,
                'description' => $item->description,
                'badge' => $item->badge,
                'fields' => $item->fields,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];
        });

        $quizzes = Quiz::orderBy('created_at', 'desc')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'type' => 'quiz',
                'title' => $item->title,
                'description' => $item->description,
                'badge' => $item->badge,
                'questions' => $item->questions,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];
        });

        // Combine all items and sort by created_at descending
        $feed = $news->concat($forms)->concat($quizzes)
            ->sortByDesc('created_at')
            ->values();

        return response()->json($feed);
    }
}
