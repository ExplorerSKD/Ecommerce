<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BannerController extends Controller
{
    /**
     * Get active banners for public display
     */
    public function index()
    {
        $banners = Banner::active()
            ->ordered()
            ->get()
            ->map(function ($banner) {
                return [
                    'id' => $banner->id,
                    'title' => $banner->title,
                    'subtitle' => $banner->subtitle,
                    'description' => $banner->description,
                    'image' => $banner->image_url,
                    'button_text' => $banner->button_text,
                    'button_link' => $banner->button_link,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $banners,
        ]);
    }

    /**
     * Admin: Get all banners
     */
    public function adminIndex()
    {
        $banners = Banner::ordered()->get()->map(function ($banner) {
            return [
                'id' => $banner->id,
                'title' => $banner->title,
                'subtitle' => $banner->subtitle,
                'description' => $banner->description,
                'image' => $banner->image_url,
                'button_text' => $banner->button_text,
                'button_link' => $banner->button_link,
                'is_active' => $banner->is_active,
                'display_order' => $banner->display_order,
                'starts_at' => $banner->starts_at?->format('Y-m-d H:i'),
                'ends_at' => $banner->ends_at?->format('Y-m-d H:i'),
                'created_at' => $banner->created_at->format('Y-m-d H:i'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $banners,
        ]);
    }

    /**
     * Admin: Create a new banner
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'display_order' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->except('image');

        // Handle image upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('banners', 'public');
            $data['image'] = $path;
        }

        // Set default display order
        if (!isset($data['display_order'])) {
            $data['display_order'] = Banner::max('display_order') + 1;
        }

        $banner = Banner::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Banner created successfully',
            'data' => [
                'id' => $banner->id,
                'title' => $banner->title,
                'image' => $banner->image_url,
            ],
        ], 201);
    }

    /**
     * Admin: Update a banner
     */
    public function update(Request $request, $id)
    {
        $banner = Banner::find($id);

        if (!$banner) {
            return response()->json([
                'success' => false,
                'message' => 'Banner not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'display_order' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->except('image');

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($banner->image && !str_starts_with($banner->image, 'http')) {
                Storage::disk('public')->delete($banner->image);
            }
            $path = $request->file('image')->store('banners', 'public');
            $data['image'] = $path;
        }

        $banner->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Banner updated successfully',
            'data' => [
                'id' => $banner->id,
                'title' => $banner->title,
                'image' => $banner->image_url,
            ],
        ]);
    }

    /**
     * Admin: Delete a banner
     */
    public function destroy($id)
    {
        $banner = Banner::find($id);

        if (!$banner) {
            return response()->json([
                'success' => false,
                'message' => 'Banner not found',
            ], 404);
        }

        // Delete image file
        if ($banner->image && !str_starts_with($banner->image, 'http')) {
            Storage::disk('public')->delete($banner->image);
        }

        $banner->delete();

        return response()->json([
            'success' => true,
            'message' => 'Banner deleted successfully',
        ]);
    }

    /**
     * Admin: Toggle banner active status
     */
    public function toggleStatus($id)
    {
        $banner = Banner::find($id);

        if (!$banner) {
            return response()->json([
                'success' => false,
                'message' => 'Banner not found',
            ], 404);
        }

        $banner->is_active = !$banner->is_active;
        $banner->save();

        return response()->json([
            'success' => true,
            'message' => 'Banner status updated',
            'data' => [
                'id' => $banner->id,
                'is_active' => $banner->is_active,
            ],
        ]);
    }

    /**
     * Admin: Reorder banners
     */
    public function reorder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order' => 'required|array',
            'order.*.id' => 'required|exists:banners,id',
            'order.*.display_order' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        foreach ($request->order as $item) {
            Banner::where('id', $item['id'])->update(['display_order' => $item['display_order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Banners reordered successfully',
        ]);
    }
}
