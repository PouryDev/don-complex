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
        // This migration is for adding branch_id if tables already exist
        // If tables don't exist yet, the branch_id is already in the create migrations
        if (Schema::hasTable('categories') && !Schema::hasColumn('categories', 'branch_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->foreignId('branch_id')->after('id')->constrained()->onDelete('cascade');
            });
        }

        if (Schema::hasTable('menu_items') && !Schema::hasColumn('menu_items', 'branch_id')) {
            Schema::table('menu_items', function (Blueprint $table) {
                $table->foreignId('branch_id')->after('id')->constrained()->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('categories', 'branch_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            });
        }

        if (Schema::hasColumn('menu_items', 'branch_id')) {
            Schema::table('menu_items', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            });
        }
    }
};
