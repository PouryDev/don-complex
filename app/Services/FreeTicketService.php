<?php

namespace App\Services;

use App\Models\FreeTicket;
use App\Models\Session;
use App\Models\User;
use App\Services\CoinService;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;

class FreeTicketService
{
    protected CoinService $coinService;

    public function __construct(CoinService $coinService)
    {
        $this->coinService = $coinService;
    }

    /**
     * Purchase free ticket with coins
     */
    public function purchaseWithCoins(User $user, int $coinsCost): FreeTicket
    {
        return DB::transaction(function () use ($user, $coinsCost) {
            // Check if user has enough coins
            if (!$this->coinService->hasEnoughCoins($user, $coinsCost)) {
                throw new \Exception('سکه کافی ندارید');
            }

            // Spend coins
            $this->coinService->spendCoins($user, $coinsCost, 'ticket_purchase');

            // Create free ticket
            $ticket = FreeTicket::create([
                'user_id' => $user->id,
                'coins_spent' => $coinsCost,
                'purchased_at' => now(),
            ]);

            return $ticket;
        });
    }

    /**
     * Use ticket for a session
     */
    public function useTicket(FreeTicket $ticket, Session $session): void
    {
        DB::transaction(function () use ($ticket, $session) {
            if (!$ticket->isValid()) {
                throw new \Exception('بلیط معتبر نیست یا قبلاً استفاده شده است');
            }

            $ticket->use($session->id);
        });
    }

    /**
     * Get user's tickets
     */
    public function getUserTickets(User $user, bool $unusedOnly = false): Collection
    {
        $query = FreeTicket::where('user_id', $user->id);

        if ($unusedOnly) {
            $query->whereNull('used_at');
        }

        return $query->orderBy('purchased_at', 'desc')->get();
    }
}


