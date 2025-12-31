<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Get the authenticated user's cart.
     */
    public function index(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateCart($request->user());
        $cart->load('items.product');

        $items = $cart->items->map(function ($item) {
            return [
                'id' => $item->id,
                'product' => [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'slug' => $item->product->slug,
                    'price' => $item->product->price,
                    'original_price' => $item->product->original_price,
                    'image' => $item->product->image,
                    'stock' => $item->product->stock,
                ],
                'quantity' => $item->quantity,
                'size' => $item->size,
                'color' => $item->color,
                'total' => $item->total,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $cart->id,
                'items' => $items,
                'items_count' => $cart->items_count,
                'subtotal' => number_format($cart->subtotal, 2, '.', ''),
            ],
        ]);
    }

    /**
     * Add item to cart.
     */
    public function addItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'size' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Check if product is active and in stock
        if (!$product->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This product is not available.',
            ], 422);
        }

        if ($product->stock < $validated['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Not enough stock available. Only ' . $product->stock . ' items left.',
            ], 422);
        }

        $cart = $this->getOrCreateCart($request->user());

        // Check if item already exists in cart
        $existingItem = $cart->items()
            ->where('product_id', $validated['product_id'])
            ->where('size', $validated['size'] ?? null)
            ->where('color', $validated['color'] ?? null)
            ->first();

        if ($existingItem) {
            $newQuantity = $existingItem->quantity + $validated['quantity'];
            
            if ($product->stock < $newQuantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not enough stock available. Only ' . $product->stock . ' items left.',
                ], 422);
            }

            $existingItem->update(['quantity' => $newQuantity]);
            $item = $existingItem;
        } else {
            $item = $cart->items()->create([
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'size' => $validated['size'] ?? null,
                'color' => $validated['color'] ?? null,
            ]);
        }

        $item->load('product');

        return response()->json([
            'success' => true,
            'message' => 'Item added to cart',
            'data' => [
                'id' => $item->id,
                'product' => $item->product,
                'quantity' => $item->quantity,
                'size' => $item->size,
                'color' => $item->color,
                'total' => $item->total,
            ],
        ], 201);
    }

    /**
     * Update cart item quantity.
     */
    public function updateItem(Request $request, CartItem $item): JsonResponse
    {
        // Verify ownership
        $cart = $this->getOrCreateCart($request->user());
        if ($item->cart_id !== $cart->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cart item not found.',
            ], 404);
        }

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        // Check stock
        if ($item->product->stock < $validated['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Not enough stock available. Only ' . $item->product->stock . ' items left.',
            ], 422);
        }

        $item->update(['quantity' => $validated['quantity']]);
        $item->load('product');

        return response()->json([
            'success' => true,
            'message' => 'Cart item updated',
            'data' => [
                'id' => $item->id,
                'product' => $item->product,
                'quantity' => $item->quantity,
                'total' => $item->total,
            ],
        ]);
    }

    /**
     * Remove item from cart.
     */
    public function removeItem(Request $request, CartItem $item): JsonResponse
    {
        // Verify ownership
        $cart = $this->getOrCreateCart($request->user());
        if ($item->cart_id !== $cart->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cart item not found.',
            ], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item removed from cart',
        ]);
    }

    /**
     * Clear all items from cart.
     */
    public function clear(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateCart($request->user());
        $cart->items()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared',
        ]);
    }

    /**
     * Get or create cart for user.
     */
    private function getOrCreateCart($user): Cart
    {
        return Cart::firstOrCreate(['user_id' => $user->id]);
    }
}
