<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FaqController extends Controller
{
    /**
     * Get all FAQs (public)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Faq::active()->ordered();

        if ($request->category) {
            $query->byCategory($request->category);
        }

        $faqs = $query->get();

        // Group by category
        $grouped = $faqs->groupBy('category');

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $faqs,
                'grouped' => $grouped,
                'categories' => Faq::active()->distinct()->pluck('category')->filter(),
            ],
        ]);
    }

    /**
     * Admin: Get all FAQs
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $faqs = Faq::ordered()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $faqs,
        ]);
    }

    /**
     * Admin: Create FAQ
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'question' => 'required|string|max:500',
            'answer' => 'required|string',
            'category' => 'nullable|string|max:100',
            'order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $faq = Faq::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'FAQ created successfully',
            'data' => $faq,
        ], 201);
    }

    /**
     * Admin: Update FAQ
     */
    public function update(Request $request, $id): JsonResponse
    {
        $faq = Faq::findOrFail($id);

        $request->validate([
            'question' => 'string|max:500',
            'answer' => 'string',
            'category' => 'nullable|string|max:100',
            'order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $faq->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'FAQ updated successfully',
            'data' => $faq,
        ]);
    }

    /**
     * Admin: Delete FAQ
     */
    public function destroy($id): JsonResponse
    {
        $faq = Faq::findOrFail($id);
        $faq->delete();

        return response()->json([
            'success' => true,
            'message' => 'FAQ deleted successfully',
        ]);
    }
}
