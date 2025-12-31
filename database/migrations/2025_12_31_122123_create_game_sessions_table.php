<?php

use App\Models\GameSession;
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
        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained();
            $table->foreignId('session_template_id')->constrained();
            $table->date('session_date');
            $table->time('start_time');
            $table->integer('max_capacity');
            $table->integer('current_capacity');
            $table->integer('price');
            $table->enum('status', GameSession::STATUSES)->default(GameSession::STATUSES[0]);
            $table->integer('version')->default(0); // For optimistic locking
            $table->timestamps();
            $table->unique(['branch_id', 'session_date', 'start_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};
