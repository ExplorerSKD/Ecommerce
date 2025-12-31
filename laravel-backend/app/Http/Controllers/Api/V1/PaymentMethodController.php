<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentMethodController extends Controller
{
    /**
     * Get all payment methods for the authenticated user
     */
    public function index()
    {
        $paymentMethods = Auth::user()->paymentMethods()->orderBy('is_default', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $paymentMethods
        ]);
    }

    /**
     * Store a new payment method
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:card,upi,netbanking',
            'name' => 'nullable|string|max:255',
            'last_four' => 'nullable|string|size:4',
            'card_brand' => 'nullable|string|max:50',
            'upi_id' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'expiry_month' => 'nullable|string|size:2',
            'expiry_year' => 'nullable|string|size:4',
            'is_default' => 'boolean',
        ]);

        $user = Auth::user();
        
        // If this is set as default, unset other defaults
        if ($request->is_default) {
            $user->paymentMethods()->update(['is_default' => false]);
        }

        // If no payment methods exist, make this the default
        if ($user->paymentMethods()->count() === 0) {
            $validated['is_default'] = true;
        }

        $validated['user_id'] = $user->id;
        $paymentMethod = PaymentMethod::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Payment method added successfully',
            'data' => $paymentMethod
        ], 201);
    }

    /**
     * Update a payment method
     */
    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        // Check ownership
        if ($paymentMethod->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'upi_id' => 'nullable|string|max:255',
            'is_default' => 'boolean',
        ]);

        // If setting as default, unset other defaults
        if ($request->is_default) {
            Auth::user()->paymentMethods()->where('id', '!=', $paymentMethod->id)->update(['is_default' => false]);
        }

        $paymentMethod->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Payment method updated successfully',
            'data' => $paymentMethod
        ]);
    }

    /**
     * Delete a payment method
     */
    public function destroy(PaymentMethod $paymentMethod)
    {
        // Check ownership
        if ($paymentMethod->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $wasDefault = $paymentMethod->is_default;
        $paymentMethod->delete();

        // If deleted method was default, set another one as default
        if ($wasDefault) {
            $firstMethod = Auth::user()->paymentMethods()->first();
            if ($firstMethod) {
                $firstMethod->update(['is_default' => true]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment method deleted successfully'
        ]);
    }

    /**
     * Set a payment method as default
     */
    public function setDefault(PaymentMethod $paymentMethod)
    {
        // Check ownership
        if ($paymentMethod->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Unset all defaults for this user
        Auth::user()->paymentMethods()->update(['is_default' => false]);

        // Set this one as default
        $paymentMethod->update(['is_default' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Default payment method updated',
            'data' => $paymentMethod
        ]);
    }
}
