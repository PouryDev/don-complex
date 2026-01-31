<?php

namespace App\Enums;

enum UserRole: string
{
    case CUSTOMER = 'customer';
    case GAME_MASTER = 'game_master';
    case ADMIN = 'admin';
    case CASHIER = 'cashier';
    case SUPERVISOR = 'supervisor';
}

