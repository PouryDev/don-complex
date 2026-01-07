<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuizResponseRequest;
use App\Http\Resources\QuizResponseResource;
use App\Models\Quiz;
use App\Models\QuizResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class QuizResponseController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreQuizResponseRequest $request, Quiz $quiz): JsonResponse|QuizResponseResource
    {
        $user = $request->user();
        $validated = $request->validated();
        $answers = $validated['answers'];

        // Calculate score based on correct answers
        $correct = 0;
        $questions = $quiz->questions ?? [];
        
        foreach ($questions as $index => $question) {
            $correctAnswer = $question['correct_answer'] ?? null;
            if (isset($answers[$index]) && $answers[$index] === $correctAnswer) {
                $correct++;
            }
        }
        
        $score = count($questions) > 0 
            ? (int) round(($correct / count($questions)) * 100) 
            : 0;

        try {
            $response = QuizResponse::create([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'answers' => $answers,
                'score' => $score,
            ]);

            return new QuizResponseResource($response);
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle duplicate submission error
            if ($e->getCode() === '23000') { // SQLSTATE[23000]: Integrity constraint violation
                return response()->json([
                    'message' => 'شما قبلاً به این کوییز پاسخ داده‌اید.'
                ], 409);
            }
            throw $e;
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Quiz $quiz): JsonResponse|QuizResponseResource
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $response = QuizResponse::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->first();

        if (!$response) {
            return response()->json(['message' => 'پاسخی یافت نشد'], 404);
        }

        return new QuizResponseResource($response);
    }
}
