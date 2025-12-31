<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    /**
     * Get reviews for a product
     */
    public function productReviews(Request $request, $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);

        $reviews = $product->reviews()
            ->approved()
            ->with('user:id,name')
            ->latest()
            ->paginate(10);

        $stats = [
            'average_rating' => round($product->reviews()->approved()->avg('rating'), 1) ?? 0,
            'total_reviews' => $product->reviews()->approved()->count(),
            'rating_distribution' => [
                5 => $product->reviews()->approved()->where('rating', 5)->count(),
                4 => $product->reviews()->approved()->where('rating', 4)->count(),
                3 => $product->reviews()->approved()->where('rating', 3)->count(),
                2 => $product->reviews()->approved()->where('rating', 2)->count(),
                1 => $product->reviews()->approved()->where('rating', 1)->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'stats' => $stats,
        ]);
    }

    /**
     * Create a review
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        // Check if user already reviewed this product
        $existing = Review::where('user_id', $user->id)
            ->where('product_id', $request->product_id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You have already reviewed this product',
            ], 400);
        }

        // Optional: Check if user has purchased the product
        // $hasPurchased = Order::where('user_id', $user->id)
        //     ->whereHas('items', fn($q) => $q->where('product_id', $request->product_id))
        //     ->where('status', 'delivered')
        //     ->exists();

        $review = Review::create([
            'user_id' => $user->id,
            'product_id' => $request->product_id,
            'rating' => $request->rating,
            'title' => $request->title,
            'comment' => $request->comment,
            'status' => 'pending', // Reviews need admin approval
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully. It will be visible after approval.',
            'data' => $review,
        ], 201);
    }

    /**
     * Get user's reviews
     */
    public function myReviews(Request $request): JsonResponse
    {
        $reviews = $request->user()
            ->reviews()
            ->with('product:id,name,image')
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $reviews,
        ]);
    }

    /**
     * Admin: Get all reviews
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Review::with(['user:id,name,email', 'product:id,name']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $reviews = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reviews,
        ]);
    }

    /**
     * Admin: Create a review (auto-approved)
     */
    public function adminStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'comment' => 'nullable|string|max:1000',
            'reviewer_name' => 'nullable|string|max:255',
        ]);

        $review = Review::create([
            'user_id' => $request->user()->id,
            'product_id' => $validated['product_id'],
            'rating' => $validated['rating'],
            'title' => $validated['title'] ?? null,
            'comment' => $validated['comment'] ?? null,
            'status' => 'approved', // Admin reviews are auto-approved
        ]);

        // Recalculate product rating
        $this->recalculateProductRating($validated['product_id']);

        $review->load(['user:id,name,email', 'product:id,name']);

        return response()->json([
            'success' => true,
            'message' => 'Review created successfully',
            'data' => $review,
        ], 201);
    }

    /**
     * Admin: Update review status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected',
        ]);

        $review = Review::findOrFail($id);
        $oldStatus = $review->status;
        $review->update(['status' => $request->status]);

        // Recalculate product rating when review status changes
        $this->recalculateProductRating($review->product_id);

        return response()->json([
            'success' => true,
            'message' => 'Review status updated',
            'data' => $review,
        ]);
    }

    /**
     * Recalculate product rating and reviews count based on approved reviews
     */
    private function recalculateProductRating($productId): void
    {
        $product = Product::find($productId);
        if (!$product) return;

        $approvedReviews = Review::where('product_id', $productId)
            ->where('status', 'approved')
            ->get();

        $reviewsCount = $approvedReviews->count();
        $averageRating = $reviewsCount > 0 
            ? round($approvedReviews->avg('rating'), 1) 
            : 0;

        $product->update([
            'rating' => $averageRating,
            'reviews_count' => $reviewsCount,
        ]);
    }

    /**
     * Admin: Delete review
     */
    public function destroy($id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted',
        ]);
    }
}
