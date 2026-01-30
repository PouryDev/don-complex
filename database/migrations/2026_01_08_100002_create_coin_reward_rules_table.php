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
        Schema::create('coin_reward_rules', function (Blueprint $table) {
            $table->id();
            $table->string('rewardable_type'); // Quiz, Form, FeedItem
            $table->unsignedBigInteger('rewardable_id');
            $table->unsignedInteger('coins');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['rewardable_type', 'rewardable_id']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coin_reward_rules');
    }
};


