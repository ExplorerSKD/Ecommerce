<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\ShiprocketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ShiprocketController extends Controller
{
    private $shiprocket;

    public function __construct(ShiprocketService $shiprocket)
    {
        $this->shiprocket = $shiprocket;
    }

    /**
     * Create shipment for an order.
     */
    public function createShipment(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        try {
            $order = Order::with('items.product', 'user')
                ->findOrFail($request->order_id);

            // Prepare order items for Shiprocket
            $orderItems = $order->items->map(function ($item) {
                return [
                    'name' => $item->product_name,
                    'sku' => 'SKU-' . $item->product_id,
                    'units' => $item->quantity,
                    'selling_price' => $item->price,
                    'discount' => 0,
                    'tax' => 0,
                    'hsn' => '',
                ];
            })->toArray();

            // Calculate total weight (default 0.5kg per item)
            $totalWeight = $order->items->sum('quantity') * 0.5;

            $shippingAddress = $order->shipping_address;

            $shiprocketOrderData = [
                'order_id' => $order->order_number,
                'order_date' => $order->created_at->format('Y-m-d H:i:s'),
                'pickup_location' => config('services.shiprocket.pickup_location', 'Primary'),
                'channel_id' => config('services.shiprocket.channel_id', ''),
                'comment' => $order->notes ?? '',
                'billing_customer_name' => $shippingAddress['first_name'] ?? $order->user->name,
                'billing_last_name' => $shippingAddress['last_name'] ?? '',
                'billing_address' => $shippingAddress['address'] ?? '',
                'billing_address_2' => $shippingAddress['address_2'] ?? '',
                'billing_city' => $shippingAddress['city'] ?? '',
                'billing_pincode' => $shippingAddress['zip'] ?? $shippingAddress['postal_code'] ?? '',
                'billing_state' => $shippingAddress['state'] ?? '',
                'billing_country' => $shippingAddress['country'] ?? 'India',
                'billing_email' => $shippingAddress['email'] ?? $order->user->email,
                'billing_phone' => $shippingAddress['phone'] ?? $order->user->phone ?? '',
                'shipping_is_billing' => true,
                'order_items' => $orderItems,
                'payment_method' => $order->payment_method === 'cash_on_delivery' ? 'COD' : 'Prepaid',
                'shipping_charges' => $order->shipping,
                'giftwrap_charges' => 0,
                'transaction_charges' => 0,
                'total_discount' => 0,
                'sub_total' => $order->subtotal,
                'length' => 20,
                'breadth' => 15,
                'height' => 10,
                'weight' => $totalWeight,
            ];

            $result = $this->shiprocket->createOrder($shiprocketOrderData);

            if ($result['success']) {
                // Update order with Shiprocket details
                $order->update([
                    'shiprocket_order_id' => $result['data']['order_id'] ?? null,
                    'shiprocket_shipment_id' => $result['data']['shipment_id'] ?? null,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Shipment created successfully',
                    'data' => $result['data'],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message'],
                'errors' => $result['errors'] ?? null,
            ], 400);
        } catch (\Exception $e) {
            Log::error('Shiprocket shipment creation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create shipment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Track shipment by AWB number.
     */
    public function trackByAwb(Request $request, string $awb)
    {
        try {
            $result = $this->shiprocket->trackShipment($awb);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get tracking info',
            ], 500);
        }
    }

    /**
     * Track shipment by order ID.
     */
    public function trackByOrderId(Request $request, string $orderId)
    {
        try {
            // Find the order
            $order = Order::where('order_number', $orderId)
                ->orWhere('id', $orderId)
                ->first();

            if (!$order || !$order->shiprocket_order_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shipment not found for this order',
                ], 404);
            }

            $result = $this->shiprocket->trackByOrderId($order->order_number);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get tracking info',
            ], 500);
        }
    }

    /**
     * Check service availability.
     */
    public function checkServiceability(Request $request)
    {
        $request->validate([
            'delivery_pincode' => 'required|string',
            'weight' => 'nullable|numeric|min:0.1',
            'cod' => 'nullable|in:yes,no',
        ]);

        try {
            $pickupPincode = config('services.shiprocket.pickup_pincode', '110001');
            $weight = $request->weight ?? 0.5;
            $cod = $request->cod ?? 'no';

            $result = $this->shiprocket->checkServiceability(
                $pickupPincode,
                $request->delivery_pincode,
                $weight,
                $cod
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check service availability',
            ], 500);
        }
    }

    /**
     * Get available couriers.
     */
    public function getAvailableCouriers(Request $request)
    {
        $request->validate([
            'delivery_pincode' => 'required|string',
            'weight' => 'nullable|numeric|min:0.1',
            'cod' => 'nullable|in:yes,no',
        ]);

        try {
            $pickupPincode = config('services.shiprocket.pickup_pincode', '110001');
            $weight = $request->weight ?? 0.5;
            $cod = $request->cod ?? 'no';

            $result = $this->shiprocket->getAvailableCouriers(
                $pickupPincode,
                $request->delivery_pincode,
                $weight,
                $cod
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get couriers',
            ], 500);
        }
    }

    /**
     * Cancel a shipment (Admin only).
     */
    public function cancelShipment(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        try {
            $order = Order::findOrFail($request->order_id);

            if (!$order->shiprocket_order_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No shipment found for this order',
                ], 404);
            }

            $result = $this->shiprocket->cancelShipment([$order->shiprocket_order_id]);

            if ($result['success']) {
                $order->update([
                    'status' => 'cancelled',
                    'shiprocket_order_id' => null,
                    'shiprocket_shipment_id' => null,
                ]);
            }

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel shipment',
            ], 500);
        }
    }

    /**
     * Generate AWB for shipment (Admin only).
     */
    public function generateAwb(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'courier_id' => 'nullable|integer',
        ]);

        try {
            $order = Order::findOrFail($request->order_id);

            if (!$order->shiprocket_shipment_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Create shipment first before generating AWB',
                ], 400);
            }

            $result = $this->shiprocket->generateAwb(
                $order->shiprocket_shipment_id,
                $request->courier_id
            );

            if ($result['success'] && isset($result['data']['response']['data']['awb_code'])) {
                $order->update([
                    'awb_code' => $result['data']['response']['data']['awb_code'],
                    'courier_name' => $result['data']['response']['data']['courier_name'] ?? null,
                    'status' => 'shipped',
                ]);
            }

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate AWB',
            ], 500);
        }
    }

    /**
     * Schedule pickup (Admin only).
     */
    public function schedulePickup(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        try {
            $order = Order::findOrFail($request->order_id);

            if (!$order->shiprocket_shipment_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Create shipment first before scheduling pickup',
                ], 400);
            }

            $result = $this->shiprocket->schedulePickup($order->shiprocket_shipment_id);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to schedule pickup',
            ], 500);
        }
    }
}
