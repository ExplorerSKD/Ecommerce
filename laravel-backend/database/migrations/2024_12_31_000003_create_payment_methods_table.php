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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['card', 'upi', 'netbanking'])->default('card');
            $table->string('name')->nullable(); // Card holder name or UPI name
            $table->string('last_four')->nullable(); // Last 4 digits of card
            $table->string('card_brand')->nullable(); // Visa, Mastercard, etc.
            $table->string('upi_id')->nullable(); // UPI ID like user@upi
            $table->string('bank_name')->nullable(); // For netbanking
            $table->string('expiry_month')->nullable();
            $table->string('expiry_year')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
