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
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('hall_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_template_id')->nullable()->constrained()->nullOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->decimal('price', 10, 2);
            $table->integer('max_participants');
            $table->integer('current_participants')->default(0);
            $table->string('status')->default('upcoming');
            $table->timestamps();

            $table->unique(['branch_id', 'hall_id', 'date', 'start_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
