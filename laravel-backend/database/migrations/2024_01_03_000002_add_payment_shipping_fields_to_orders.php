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
        Schema::table('orders', function (Blueprint $table) {
            // Razorpay fields
            $table->string('razorpay_order_id')->nullable()->after('payment_status');
            $table->string('razorpay_payment_id')->nullable()->after('razorpay_order_id');
            
            // Shiprocket fields
            $table->string('shiprocket_order_id')->nullable()->after('razorpay_payment_id');
            $table->string('shiprocket_shipment_id')->nullable()->after('shiprocket_order_id');
            $table->string('awb_code')->nullable()->after('shiprocket_shipment_id');
            $table->string('courier_name')->nullable()->after('awb_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'razorpay_order_id',
                'razorpay_payment_id',
                'shiprocket_order_id',
                'shiprocket_shipment_id',
                'awb_code',
                'courier_name',
            ]);
        });
    }
};
