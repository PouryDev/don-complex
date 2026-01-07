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
        // Feed items indexes for better polymorphic query performance
        Schema::table('feed_items', function (Blueprint $table) {
            // Composite index for common query pattern: is_active + scheduled_at
            $table->index(['is_active', 'scheduled_at'], 'feed_items_active_scheduled_idx');
            // Composite index for ordering
            $table->index(['is_active', 'order', 'scheduled_at'], 'feed_items_active_order_scheduled_idx');
        });

        // Categories indexes for filtering by branch and active status
        Schema::table('categories', function (Blueprint $table) {
            $table->index(['branch_id', 'is_active', 'order'], 'categories_branch_active_order_idx');
        });

        // Menu items indexes for filtering by branch and availability
        Schema::table('menu_items', function (Blueprint $table) {
            $table->index(['branch_id', 'is_available', 'order'], 'menu_items_branch_available_order_idx');
        });

        // Payment gateways indexes for active gateways query
        Schema::table('payment_gateways', function (Blueprint $table) {
            $table->index(['is_active', 'sort_order'], 'payment_gateways_active_sort_idx');
        });

        // Reservations indexes for common query patterns
        Schema::table('reservations', function (Blueprint $table) {
            // Index for session reservations with payment status and expiration
            $table->index(['session_id', 'payment_status', 'expires_at'], 'reservations_session_payment_expires_idx');
            // Index for user reservations with payment status
            $table->index(['user_id', 'payment_status'], 'reservations_user_payment_idx');
            // Index for unpaid reservations query
            $table->index(['payment_status', 'expires_at', 'cancelled_at'], 'reservations_unpaid_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feed_items', function (Blueprint $table) {
            $table->dropIndex('feed_items_active_scheduled_idx');
            $table->dropIndex('feed_items_active_order_scheduled_idx');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('categories_branch_active_order_idx');
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropIndex('menu_items_branch_available_order_idx');
        });

        Schema::table('payment_gateways', function (Blueprint $table) {
            $table->dropIndex('payment_gateways_active_sort_idx');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex('reservations_session_payment_expires_idx');
            $table->dropIndex('reservations_user_payment_idx');
            $table->dropIndex('reservations_unpaid_idx');
        });
    }
};
