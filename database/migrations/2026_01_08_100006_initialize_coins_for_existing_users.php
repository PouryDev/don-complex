<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create coin records for all existing users with balance 0
        DB::statement('
            INSERT INTO coins (user_id, balance, created_at, updated_at)
            SELECT id, 0, NOW(), NOW()
            FROM users
            WHERE id NOT IN (SELECT user_id FROM coins)
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to delete coins on rollback
    }
};


