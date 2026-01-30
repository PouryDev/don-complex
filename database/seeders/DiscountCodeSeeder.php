<?php

namespace Database\Seeders;

use App\Models\DiscountCode;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DiscountCodeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $discountCodes = [
            [
                'code' => 'WELCOME10',
                'type' => 'percentage',
                'value' => 10,
                'min_order_amount' => 50000,
                'max_uses' => 100,
                'coins_cost' => 50,
                'expires_at' => Carbon::now()->addMonths(3),
            ],
            [
                'code' => 'SAVE20',
                'type' => 'percentage',
                'value' => 20,
                'min_order_amount' => 100000,
                'max_uses' => 50,
                'coins_cost' => 100,
                'expires_at' => Carbon::now()->addMonths(2),
            ],
            [
                'code' => 'FIXED50000',
                'type' => 'fixed',
                'value' => 50000,
                'min_order_amount' => 200000,
                'max_uses' => 30,
                'coins_cost' => 150,
                'expires_at' => Carbon::now()->addMonths(1),
            ],
            [
                'code' => 'VIP30',
                'type' => 'percentage',
                'value' => 30,
                'min_order_amount' => 150000,
                'max_uses' => 20,
                'coins_cost' => 200,
                'expires_at' => Carbon::now()->addMonths(6),
            ],
        ];

        foreach ($discountCodes as $codeData) {
            DiscountCode::firstOrCreate(
                ['code' => $codeData['code']],
                $codeData
            );
        }
    }
}


