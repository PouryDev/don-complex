<?php

namespace App\Contracts;

use App\Models\PaymentTransaction;

interface PaymentGatewayInterface
{
    /**
     * Initialize payment and return redirect URL or payment form data
     *
     * @param PaymentTransaction $transaction
     * @param array $additionalData Additional data for payment (e.g., callback URL)
     * @return array ['success' => bool, 'redirect_url' => string|null, 'form_data' => array|null, 'message' => string]
     */
    public function initiate(PaymentTransaction $transaction, array $additionalData = []): array;

    /**
     * Verify payment transaction
     *
     * @param PaymentTransaction $transaction
     * @param array $callbackData Data received from gateway callback
     * @return array ['success' => bool, 'verified' => bool, 'message' => string, 'data' => array]
     */
    public function verify(PaymentTransaction $transaction, array $callbackData = []): array;

    /**
     * Handle callback from gateway
     *
     * @param array $callbackData Data received from gateway
     * @return array ['success' => bool, 'transaction_id' => int|null, 'verified' => bool, 'message' => string]
     */
    public function callback(array $callbackData): array;

    /**
     * Get gateway display name
     *
     * @return string
     */
    public function getDisplayName(): string;

    /**
     * Check if gateway is available
     *
     * @return bool
     */
    public function isAvailable(): bool;
}

