<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use App\Models\PaymentGateway;
use App\Services\Payment\Gateways\ZarinPalGateway;
use InvalidArgumentException;

class PaymentGatewayFactory
{
    /**
     * Create gateway instance based on gateway type
     *
     * @param PaymentGateway $gateway
     * @return PaymentGatewayInterface
     * @throws InvalidArgumentException
     */
    public static function create(PaymentGateway $gateway): PaymentGatewayInterface
    {
        return match ($gateway->type) {
            'zarinpal' => new ZarinPalGateway($gateway),
            default => throw new InvalidArgumentException("Gateway type '{$gateway->type}' is not supported"),
        };
    }

    /**
     * Create gateway instance by type string
     *
     * @param string $type
     * @return PaymentGatewayInterface
     * @throws InvalidArgumentException
     */
    public static function createByType(string $type): PaymentGatewayInterface
    {
        $gateway = PaymentGateway::where('type', $type)->first();

        if (!$gateway) {
            throw new InvalidArgumentException("Gateway with type '{$type}' not found");
        }

        return self::create($gateway);
    }

    /**
     * Create gateway instance by ID
     *
     * @param int $id
     * @return PaymentGatewayInterface
     * @throws InvalidArgumentException
     */
    public static function createById(int $id): PaymentGatewayInterface
    {
        $gateway = PaymentGateway::find($id);

        if (!$gateway) {
            throw new InvalidArgumentException("Gateway with ID '{$id}' not found");
        }

        return self::create($gateway);
    }
}

