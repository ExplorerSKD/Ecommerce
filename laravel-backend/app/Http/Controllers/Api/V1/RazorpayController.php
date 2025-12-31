<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Razorpay\Api\Api;

class RazorpayController extends Controller
{
    private $razorpay;

    public function __construct()
    {
        $this->razorpay = new Api(
            config('services.razorpay.key_id'),
            config('services.razorpay.key_secret')
        );
    }

    /**
     * Create a Razorpay order for payment.
     */
    public function createOrder(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        try {
            $order = Order::where('id', $request->order_id)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            // Create Razorpay order
            $razorpayOrder = $this->razorpay->order->create([
                'receipt' => $order->order_number,
                'amount' => (int) ($order->total * 100), // Amount in paise
                'currency' => 'INR',
                'notes' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ],
            ]);

            // Store Razorpay order ID with the order
            $order->update([
                'razorpay_order_id' => $razorpayOrder->id,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'razorpay_order_id' => $razorpayOrder->id,
                    'razorpay_key_id' => config('services.razorpay.key_id'),
                    'amount' => $razorpayOrder->amount,
                    'currency' => $razorpayOrder->currency,
                    'order_number' => $order->order_number,
                    'name' => config('app.name', 'E-Commerce Store'),
                    'description' => 'Order #' . $order->order_number,
                    'prefill' => [
                        'name' => auth()->user()->name,
                        'email' => auth()->user()->email,
                        'contact' => auth()->user()->phone ?? '',
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Razorpay order creation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify Razorpay payment signature.
     */
    public function verifyPayment(Request $request)
    {
        $request->validate([
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        try {
            // Verify signature
            $attributes = [
                'razorpay_order_id' => $request->razorpay_order_id,
                'razorpay_payment_id' => $request->razorpay_payment_id,
                'razorpay_signature' => $request->razorpay_signature,
            ];

            $this->razorpay->utility->verifyPaymentSignature($attributes);

            // Find and update the order
            $order = Order::where('razorpay_order_id', $request->razorpay_order_id)->firstOrFail();
            
            $order->update([
                'payment_status' => 'paid',
                'razorpay_payment_id' => $request->razorpay_payment_id,
                'status' => 'confirmed',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment verified successfully',
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'payment_status' => 'paid',
                ],
            ]);
        } catch (\Razorpay\Api\Errors\SignatureVerificationError $e) {
            Log::error('Razorpay signature verification failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed',
                'error' => 'Invalid payment signature',
            ], 400);
        } catch (\Exception $e) {
            Log::error('Razorpay payment verification error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle Razorpay webhook events.
     */
    public function handleWebhook(Request $request)
    {
        $webhookSecret = config('services.razorpay.webhook_secret');
        $webhookSignature = $request->header('X-Razorpay-Signature');
        $webhookBody = $request->getContent();

        try {
            // Verify webhook signature if secret is configured
            if ($webhookSecret) {
                $expectedSignature = hash_hmac('sha256', $webhookBody, $webhookSecret);
                if ($webhookSignature !== $expectedSignature) {
                    Log::warning('Razorpay webhook signature mismatch');
                    return response()->json(['status' => 'invalid signature'], 400);
                }
            }

            $payload = json_decode($webhookBody, true);
            $event = $payload['event'] ?? '';

            switch ($event) {
                case 'payment.captured':
                    $this->handlePaymentCaptured($payload['payload']['payment']['entity']);
                    break;
                case 'payment.failed':
                    $this->handlePaymentFailed($payload['payload']['payment']['entity']);
                    break;
                case 'order.paid':
                    $this->handleOrderPaid($payload['payload']['order']['entity']);
                    break;
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Razorpay webhook error: ' . $e->getMessage());
            return response()->json(['status' => 'error'], 500);
        }
    }

    private function handlePaymentCaptured($payment)
    {
        $order = Order::where('razorpay_order_id', $payment['order_id'])->first();
        if ($order) {
            $order->update([
                'payment_status' => 'paid',
                'razorpay_payment_id' => $payment['id'],
                'status' => 'confirmed',
            ]);
            Log::info('Payment captured for order: ' . $order->order_number);
        }
    }

    private function handlePaymentFailed($payment)
    {
        $order = Order::where('razorpay_order_id', $payment['order_id'])->first();
        if ($order) {
            $order->update([
                'payment_status' => 'failed',
            ]);
            Log::info('Payment failed for order: ' . $order->order_number);
        }
    }

    private function handleOrderPaid($razorpayOrder)
    {
        $order = Order::where('razorpay_order_id', $razorpayOrder['id'])->first();
        if ($order && $order->payment_status !== 'paid') {
            $order->update([
                'payment_status' => 'paid',
                'status' => 'confirmed',
            ]);
            Log::info('Order paid via webhook: ' . $order->order_number);
        }
    }

    /**
     * Get payment status for an order.
     */
    public function getPaymentStatus(Request $request, $orderId)
    {
        try {
            $order = Order::where('id', $orderId)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'payment_status' => $order->payment_status,
                    'payment_method' => $order->payment_method,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }
    }
}
