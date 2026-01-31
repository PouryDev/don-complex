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
     * Handles both H:i and H:i:s formats
     */
    public static function createFromDateAndTime(string $date, string $time): Carbon
    {
        // Normalize time format - ensure it has seconds
        $timeParts = explode(':', trim($time));
        
        // Take only first 3 parts (hour, minute, second)
        $hour = $timeParts[0] ?? '00';
        $minute = $timeParts[1] ?? '00';
        $second = $timeParts[2] ?? '00';
        
        // Reconstruct time in H:i:s format
        $normalizedTime = sprintf('%02d:%02d:%02d', (int)$hour, (int)$minute, (int)$second);
        
        // Combine date and time and parse in Iran timezone
        $dateTimeString = $date . ' ' . $normalizedTime;
        return Carbon::createFromFormat('Y-m-d H:i:s', $dateTimeString, 'Asia/Tehran');
    }
}

