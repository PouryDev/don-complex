<?php

namespace App\Enums;

enum SessionStatus: string
{
    case UPCOMING = 'upcoming';
    case ONGOING = 'ongoing';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}

