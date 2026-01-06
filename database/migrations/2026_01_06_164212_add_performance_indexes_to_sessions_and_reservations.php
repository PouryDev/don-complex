<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('game_sessions', function (Blueprint $table) {
            // Indexes for frequently filtered columns
            $table->index('branch_id');
            $table->index('date');
            $table->index('status');
            // Composite index for common query patterns
            $table->index(['date', 'start_time']);
            $table->index(['branch_id', 'date']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            // Indexes for foreign keys and frequently queried columns
            $table->index('session_id');
            $table->index('user_id');
            $table->index('created_at');
            // Composite index for common query patterns
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_sessions', function (Blueprint $table) {
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['date']);
            $table->dropIndex(['status']);
            $table->dropIndex(['date', 'start_time']);
            $table->dropIndex(['branch_id', 'date']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['session_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['user_id', 'created_at']);
        });
    }
};
