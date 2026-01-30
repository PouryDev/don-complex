<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FreeTicketResource;
use App\Models\FreeTicket;
use App\Models\Session;
use App\Services\FreeTicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FreeTicketController extends Controller
{
    protected FreeTicketService $freeTicketService;

    public function __construct(FreeTicketService $freeTicketService)
    {
        $this->freeTicketService = $freeTicketService;
    }

    /**
     * Get user's free tickets
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $unusedOnly = $request->boolean('unused_only', false);
        
        $tickets = $this->freeTicketService->getUserTickets($user, $unusedOnly);
        $tickets->load('session');

        return FreeTicketResource::collection($tickets);
    }

    /**
     * Purchase free ticket with coins
     */
    public function purchase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'coins_cost' => ['required', 'integer', 'min:1'],
        ]);

        try {
            $user = $request->user();
            $ticket = $this->freeTicketService->purchaseWithCoins($user, $validated['coins_cost']);

            return response()->json([
                'message' => 'بلیط رایگان با موفقیت خریداری شد',
                'data' => new FreeTicketResource($ticket),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Use free ticket for a session
     */
    public function use(Request $request, FreeTicket $freeTicket): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['required', 'exists:game_sessions,id'],
        ]);

        try {
            $session = Session::findOrFail($validated['session_id']);
            $this->freeTicketService->useTicket($freeTicket, $session);

            return response()->json([
                'message' => 'بلیط با موفقیت استفاده شد',
                'data' => new FreeTicketResource($freeTicket->load('session')),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}


