<?php

namespace Database\Seeders;

use App\Models\PaymentGateway;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PaymentGatewaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ZarinPal Gateway
        PaymentGateway::updateOrCreate(
            ['type' => 'zarinpal'],
            [
                'name' => 'زرین‌پال',
                'display_name' => 'زرین‌پال',
                'description' => 'درگاه پرداخت آنلاین زرین‌پال',
                'config' => [
                    'merchant_id' => env('ZARINPAL_MERCHANT_ID', ''),
                    'sandbox' => env('ZARINPAL_SANDBOX', true), // Default to sandbox for testing
                ],
                'is_active' => false, // Default to inactive until configured
                'sort_order' => 1,
            ]
        );
    }
}
