<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CouponController extends Controller
{
    /**
     * Validate and apply a coupon
     */
    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'order_amount' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($request->code))->first();

        if (!$coupon) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid coupon code',
            ], 404);
        }

        if (!$coupon->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'This coupon has expired or is no longer valid',
            ], 400);
        }

        $discount = $coupon->calculateDiscount($request->order_amount);

        if ($discount === 0 && $coupon->min_order_amount) {
            return response()->json([
                'success' => false,
                'message' => "Minimum order amount of ₹{$coupon->min_order_amount} required",
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'coupon' => [
                    'code' => $coupon->code,
                    'description' => $coupon->description,
                    'discount_type' => $coupon->discount_type,
                    'discount_value' => $coupon->discount_value,
                ],
                'discount_amount' => $discount,
                'final_amount' => $request->order_amount - $discount,
            ],
        ]);
    }

    /**
     * Admin: Get all coupons
     */
    public function index(Request $request): JsonResponse
    {
        $query = Coupon::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $coupons = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $coupons,
        ]);
    }

    /**
     * Admin: Create coupon
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|unique:coupons,code',
            'description' => 'nullable|string',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
        ]);

        $coupon = Coupon::create([
            ...$request->all(),
            'code' => strtoupper($request->code),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Coupon created successfully',
            'data' => $coupon,
        ], 201);
    }

    /**
     * Admin: Update coupon
     */
    public function update(Request $request, $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);

        $request->validate([
            'code' => 'string|unique:coupons,code,' . $id,
            'description' => 'nullable|string',
            'discount_type' => 'in:percentage,fixed',
            'discount_value' => 'numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
        ]);

        $data = $request->all();
        if (isset($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }

        $coupon->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Coupon updated successfully',
            'data' => $coupon,
        ]);
    }

    /**
     * Admin: Delete coupon
     */
    public function destroy($id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json([
            'success' => true,
            'message' => 'Coupon deleted successfully',
        ]);
    }
}
