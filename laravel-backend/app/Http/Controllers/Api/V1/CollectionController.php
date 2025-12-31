<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CollectionController extends Controller
{
    /**
     * Get all collections (public)
     */
    public function index(): JsonResponse
    {
        $collections = Collection::active()
            ->withCount('products')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $collections,
        ]);
    }

    /**
     * Get collection details with products
     */
    public function show($slug): JsonResponse
    {
        $collection = Collection::where('slug', $slug)
            ->active()
            ->with('products.category')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $collection,
        ]);
    }

    /**
     * Admin: Get all collections
     */
    public function adminIndex(): JsonResponse
    {
        $collections = Collection::withCount('products')
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $collections,
        ]);
    }

    /**
     * Admin: Create collection
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        $collection = Collection::create($request->except('product_ids'));

        if ($request->product_ids) {
            $collection->products()->sync($request->product_ids);
        }

        return response()->json([
            'success' => true,
            'message' => 'Collection created successfully',
            'data' => $collection->load('products'),
        ], 201);
    }

    /**
     * Admin: Update collection
     */
    public function update(Request $request, $id): JsonResponse
    {
        $collection = Collection::findOrFail($id);

        $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        $collection->update($request->except('product_ids'));

        if ($request->has('product_ids')) {
            $collection->products()->sync($request->product_ids);
        }

        return response()->json([
            'success' => true,
            'message' => 'Collection updated successfully',
            'data' => $collection->load('products'),
        ]);
    }

    /**
     * Admin: Delete collection
     */
    public function destroy($id): JsonResponse
    {
        $collection = Collection::findOrFail($id);
        $collection->products()->detach();
        $collection->delete();

        return response()->json([
            'success' => true,
            'message' => 'Collection deleted successfully',
        ]);
    }

    /**
     * Admin: Add products to collection
     */
    public function addProducts(Request $request, $id): JsonResponse
    {
        $collection = Collection::findOrFail($id);

        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        $collection->products()->syncWithoutDetaching($request->product_ids);

        return response()->json([
            'success' => true,
            'message' => 'Products added to collection',
            'data' => $collection->load('products'),
        ]);
    }

    /**
     * Admin: Remove products from collection
     */
    public function removeProducts(Request $request, $id): JsonResponse
    {
        $collection = Collection::findOrFail($id);

        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        $collection->products()->detach($request->product_ids);

        return response()->json([
            'success' => true,
            'message' => 'Products removed from collection',
            'data' => $collection->load('products'),
        ]);
    }
}
