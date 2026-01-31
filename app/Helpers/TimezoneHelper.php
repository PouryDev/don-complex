<?php

namespace App\Helpers;

use Carbon\Carbon;

class TimezoneHelper
{
    /**
     * Get current time in Iran timezone (Asia/Tehran)
     * This ensures all date/time comparisons use Iran timezone
     * while data is still stored as UTC in database
     */
    public static function now(): Carbon
    {
        return Carbon::now('Asia/Tehran');
    }

    /**
     * Get today's date in Iran timezone
     */
    public static function today(): Carbon
    {
        return Carbon::today('Asia/Tehran');
    }

    /**
     * Parse a date/time string and set it to Iran timezone
     * Useful when parsing dates from database (stored as UTC)
     */
    public static function parseInIranTimezone(string $dateTime): Carbon
    {
        return Carbon::parse($dateTime, 'UTC')->setTimezone('Asia/Tehran');
    }

    /**
     * Convert a Carbon instance to Iran timezone
     */
    public static function toIranTimezone(Carbon $carbon): Carbon
    {
        return $carbon->setTimezone('Asia/Tehran');
    }

    /**
     * Create a Carbon instance from date and time strings in Iran timezone
     * Useful for combining session date and start_time
     */
    public static function createFromDateAndTime(string $date, string $time): Carbon
    {
        return Carbon::createFromFormat('Y-m-d H:i:s', $date . ' ' . $time, 'Asia/Tehran');
    }
}

