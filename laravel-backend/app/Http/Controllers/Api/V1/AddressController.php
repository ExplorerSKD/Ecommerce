<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UserAddress;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AddressController extends Controller
{
    /**
     * Get user's addresses
     */
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()
            ->addresses()
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $addresses,
        ]);
    }

    /**
     * Create new address
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'nullable|string|max:50',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'address_line_1' => 'required|string|max:500',
            'address_line_2' => 'nullable|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'country' => 'nullable|string|max:100',
            'is_default' => 'boolean',
        ]);

        $user = $request->user();

        // If this is the first address or set as default
        $isDefault = $request->is_default || $user->addresses()->count() === 0;

        if ($isDefault) {
            // Remove default from other addresses
            $user->addresses()->update(['is_default' => false]);
        }

        $address = $user->addresses()->create([
            ...$request->all(),
            'is_default' => $isDefault,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Address added successfully',
            'data' => $address,
        ], 201);
    }

    /**
     * Update address
     */
    public function update(Request $request, $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);

        $request->validate([
            'title' => 'nullable|string|max:50',
            'first_name' => 'string|max:100',
            'last_name' => 'string|max:100',
            'phone' => 'string|max:20',
            'address_line_1' => 'string|max:500',
            'address_line_2' => 'nullable|string|max:500',
            'city' => 'string|max:100',
            'state' => 'string|max:100',
            'postal_code' => 'string|max:20',
            'country' => 'nullable|string|max:100',
            'is_default' => 'boolean',
        ]);

        if ($request->is_default) {
            $address->setAsDefault();
        }

        $address->update($request->except('is_default'));

        return response()->json([
            'success' => true,
            'message' => 'Address updated successfully',
            'data' => $address,
        ]);
    }

    /**
     * Delete address
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);
        
        $wasDefault = $address->is_default;
        $address->delete();

        // If deleted address was default, set another as default
        if ($wasDefault) {
            $newDefault = $request->user()->addresses()->first();
            if ($newDefault) {
                $newDefault->update(['is_default' => true]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Address deleted successfully',
        ]);
    }

    /**
     * Set address as default
     */
    public function setDefault(Request $request, $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);
        $address->setAsDefault();

        return response()->json([
            'success' => true,
            'message' => 'Default address updated',
            'data' => $address,
        ]);
    }
}
