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
        // Add branch_id to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('phone')->constrained('branches')->nullOnDelete();
        });

        // Migrate existing data: set branch_id in users based on game_master_id in branches
        DB::table('branches')
            ->whereNotNull('game_master_id')
            ->get()
            ->each(function ($branch) {
                DB::table('users')
                    ->where('id', $branch->game_master_id)
                    ->update(['branch_id' => $branch->id]);
            });

        // Remove game_master_id from branches table
        Schema::table('branches', function (Blueprint $table) {
            $table->dropForeign(['game_master_id']);
            $table->dropColumn('game_master_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add game_master_id back to branches table
        Schema::table('branches', function (Blueprint $table) {
            $table->foreignId('game_master_id')->nullable()->unique()->after('address')->constrained('users')->nullOnDelete();
        });

        // Migrate data back: set game_master_id in branches based on branch_id in users
        // Note: This will only set the first game master found for each branch
        DB::table('users')
            ->whereNotNull('branch_id')
            ->get()
            ->each(function ($user) {
                DB::table('branches')
                    ->where('id', $user->branch_id)
                    ->whereNull('game_master_id')
                    ->update(['game_master_id' => $user->id]);
            });

        // Remove branch_id from users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
