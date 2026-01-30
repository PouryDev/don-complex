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
        Schema::create('coin_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('amount'); // positive for earning, negative for spending
            $table->enum('type', ['earned', 'spent']);
            $table->enum('source', ['quiz', 'form', 'reservation', 'feed_view', 'discount_purchase', 'ticket_purchase']);
            $table->string('description')->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->string('related_type')->nullable();
            $table->timestamp('created_at');
            
            // Indexes for performance
            $table->index('user_id');
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'source']);
            $table->index(['related_type', 'related_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coin_transactions');
    }
};


