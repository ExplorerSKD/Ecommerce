<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ShiprocketService
{
    private $baseUrl = 'https://apiv2.shiprocket.in/v1/external';
    private $token;

    public function __construct()
    {
        $this->token = $this->getAuthToken();
    }

    /**
     * Get authentication token from Shiprocket.
     */
    private function getAuthToken(): ?string
    {
        // Cache token for 24 hours (Shiprocket tokens typically last for 10 days)
        return Cache::remember('shiprocket_token', 86400, function () {
            $response = Http::post($this->baseUrl . '/auth/login', [
                'email' => config('services.shiprocket.email'),
                'password' => config('services.shiprocket.password'),
            ]);

            if ($response->successful()) {
                return $response->json('token');
            }

            Log::error('Shiprocket authentication failed: ' . $response->body());
            return null;
        });
    }

    /**
     * Make authenticated API request.
     */
    private function request(string $method, string $endpoint, array $data = [])
    {
        if (!$this->token) {
            throw new \Exception('Shiprocket authentication failed');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
            'Content-Type' => 'application/json',
        ])->$method($this->baseUrl . $endpoint, $data);

        return $response;
    }

    /**
     * Create a new order in Shiprocket.
     */
    public function createOrder(array $orderData)
    {
        try {
            $response = $this->request('post', '/orders/create/adhoc', $orderData);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            Log::error('Shiprocket order creation failed: ' . $response->body());
            return [
                'success' => false,
                'message' => 'Failed to create Shiprocket order',
                'errors' => $response->json(),
            ];
        } catch (\Exception $e) {
            Log::error('Shiprocket order creation error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Generate AWB (Air Waybill) for shipment.
     */
    public function generateAwb(int $shipmentId, int $courierId = null)
    {
        try {
            $data = ['shipment_id' => $shipmentId];
            if ($courierId) {
                $data['courier_id'] = $courierId;
            }

            $response = $this->request('post', '/courier/assign/awb', $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to generate AWB',
                'errors' => $response->json(),
            ];
        } catch (\Exception $e) {
            Log::error('Shiprocket AWB generation error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get tracking details for a shipment.
     */
    public function trackShipment(string $awbCode)
    {
        try {
            $response = $this->request('get', '/courier/track/awb/' . $awbCode);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to get tracking info',
            ];
        } catch (\Exception $e) {
            Log::error('Shiprocket tracking error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Track shipment by order ID.
     */
    public function trackByOrderId(string $orderId)
    {
        try {
            $response = $this->request('get', '/courier/track', [
                'order_id' => $orderId,
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to get tracking info',
            ];
        } catch (\Exception $e) {
            Log::error('Shiprocket tracking error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check service availability for a pincode.
     */
    public function checkServiceability(string $pickupPincode, string $deliveryPincode, float $weight, string $cod = 'no')
    {
        try {
            $response = $this->request('get', '/courier/serviceability/', [
                'pickup_postcode' => $pickupPincode,
                'delivery_postcode' => $deliveryPincode,
                'weight' => $weight,
                'cod' => $cod === 'yes' ? 1 : 0,
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => 'Service not available',
            ];
        } catch (\Exception $e) {
            Log::error('Shiprocket serviceability check error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get available couriers for shipment.
     */
    public function getAvailableCouriers(string $pickupPincode, string $deliveryPincode, float $weight, string $cod = 'no')
    {
        try {
            $response = $this->request('get', '/courier/courierListWithCounts', [
                'pickup_postcode' => $pickupPincode,
                'delivery_postcode' => $deliveryPincode,
                'weight' => $weight,
                'cod' => $cod === 'yes' ? 1 : 0,
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to get couriers',
            ];
        } catch (\Exception $e) {
            Log::error('Shiprocket get couriers error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Cancel a shipment.
     */
    public function cancelShipment(array $shipmentIds)
    {
        try {
            $response = $this->request('post', '/orders/cancel', [
                'ids' => $shipmentIds,
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to cancel shipment',
            ];
        } catch (\Exception $e) {
            Log::error('Shiprocket cancel shipment error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Schedule a pickup.
     */
    public function schedulePickup(int $shipmentId)
    {
        try {
            $response = $this->request('post', '/courier/generate/pickup', [
                'shipment_id' => [$shipmentId],
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to schedule pickup',
            ];
        } catch (\Exception $e) {
            Log::error('Shiprocket pickup scheduling error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get pickup locations.
     */
    public function getPickupLocations()
    {
        try {
            $response = $this->request('get', '/settings/company/pickup');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to get pickup locations',
            ];
        } catch (\Exception $e) {
            Log::error('Shiprocket get pickup locations error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create a return order.
     */
    public function createReturnOrder(array $returnData)
    {
        try {
            $response = $this->request('post', '/orders/create/return', $returnData);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to create return order',
                'errors' => $response->json(),
            ];
        } catch (\Exception $e) {
            Log::error('Shiprocket return order error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }
}
