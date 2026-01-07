<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFormResponseRequest;
use App\Http\Resources\FormResponseResource;
use App\Models\Form;
use App\Models\FormResponse;
use Illuminate\Http\JsonResponse;

class FormResponseController extends Controller
{
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
